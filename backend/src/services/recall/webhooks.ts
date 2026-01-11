/**
 * Recall.ai Webhook Handlers
 * 
 * Processes webhook events from Recall.ai for:
 * - Real-time transcription updates
 * - Bot status changes
 * - Recording completion
 */

import { createHmac } from 'crypto';
import prisma from '../../lib/prisma';
import { webhookLogger as logger, transcriptLogger } from '../../lib/logger';
import { updateBotStatus } from './bot';
import { RecallBotStatus } from './client';
import { processForWakeWord } from '../ai/wake-word';

const WEBHOOK_SECRET = process.env.RECALL_WEBHOOK_SECRET;

// ============================================
// TYPES
// ============================================

export interface RecallWebhookEvent {
  event: string;
  data: any;
}

// Actual Recall.ai webhook format
export interface TranscriptDataEvent {
  data: {
    words: Array<{
      text: string;
      start_timestamp: {
        relative: number;
        absolute: string;
      };
      end_timestamp: {
        relative: number;
        absolute: string;
      };
    }>;
    participant: {
      id: number;
      name: string;
      is_host: boolean;
      platform: string;
    };
  };
  transcript: {
    id: string;
    metadata: object;
  };
  bot: {
    id: string;
    metadata: object;
  };
}

export interface BotStatusChangeEvent {
  bot_id: string;
  status: {
    code: RecallBotStatus;
    message: string | null;
    created_at: string;
  };
}

export interface RecordingDoneEvent {
  bot_id: string;
  video_url: string | null;
  duration: number;
}

// Event handlers registry
type WebhookHandler = (data: any) => Promise<void>;
const eventHandlers: Map<string, WebhookHandler[]> = new Map();

// ============================================
// WEBHOOK VERIFICATION
// ============================================

/**
 * Verify webhook signature from Recall.ai
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!WEBHOOK_SECRET) {
    logger.warn('RECALL_WEBHOOK_SECRET not set, skipping signature verification');
    return true;
  }

  const expectedSignature = createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return signature === `sha256=${expectedSignature}`;
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Handle transcript data event
 */
async function handleTranscriptData(eventData: TranscriptDataEvent): Promise<void> {
  const { data, bot } = eventData;
  const bot_id = bot.id;

  // Find meeting for this bot
  const meetingBot = await prisma.meetingBot.findUnique({
    where: { recallBotId: bot_id },
  });

  if (!meetingBot) {
    logger.warn({ botId: bot_id }, 'No meeting found for bot');
    return;
  }

  // Extract text and speaker info
  const text = data.words.map(w => w.text).join(' ');
  const speaker = data.participant?.name || 'Unknown Speaker';
  const speakerId = data.participant?.id || null;
  const timestamp = data.words[0]?.start_timestamp?.absolute 
    ? new Date(data.words[0].start_timestamp.absolute) 
    : new Date();

  // Store transcript entry in database
  const entry = await prisma.transcriptEntry.create({
    data: {
      meetingId: meetingBot.meetingId,
      speakerName: speaker,
      content: text,
      confidence: 0.95, // meeting_captions doesn't provide confidence
      timestamp,
    },
  });

  // Emit event for real-time processing (will be picked up by WebSocket server)
  emitEvent('transcript.final', {
    meetingId: meetingBot.meetingId,
    entryId: entry.id,
    speaker,
    speakerId,
    text,
    confidence: 0.95,
    timestamp: entry.timestamp,
  });

  transcriptLogger.debug({ speaker, text: text.substring(0, 80) }, 'Transcript received');

  // Process for wake word detection (async, don't wait)
  processForWakeWord(meetingBot.meetingId, speaker, text)
    .then(result => {
      if (result.detected) {
        transcriptLogger.info({ responded: result.responded }, 'Wake word detected');
      }
    })
    .catch(err => logger.error({ err }, 'Wake word processing error'));
}

/**
 * Handle bot status change event
 */
async function handleBotStatusChange(data: BotStatusChangeEvent): Promise<void> {
  const { bot_id, status } = data;

  await updateBotStatus(bot_id, status.code, status.message || undefined);

  // Emit event for frontend updates
  emitEvent('bot.status', {
    botId: bot_id,
    status: status.code,
    message: status.message,
  });
}

/**
 * Handle recording done event
 */
async function handleRecordingDone(data: RecordingDoneEvent): Promise<void> {
  const { bot_id, video_url, duration } = data;

  // Find meeting for this bot
  const meetingBot = await prisma.meetingBot.findUnique({
    where: { recallBotId: bot_id },
  });

  if (!meetingBot) {
    logger.warn({ botId: bot_id }, 'No meeting found for bot');
    return;
  }

  // Update bot with recording URL
  await prisma.meetingBot.update({
    where: { recallBotId: bot_id },
    data: {
      recordingUrl: video_url,
      status: 'completed',
      leftAt: new Date(),
    },
  });

  // Update meeting with recording info and mark as completed
  await prisma.meeting.update({
    where: { id: meetingBot.meetingId },
    data: {
      isRecording: false,
      recordingDuration: Math.round(duration / 60), // Convert to minutes
      recordingUrl: video_url,
      actualEnd: new Date(),
      phase: 'COMPLETED',
    },
  });

  // Emit event
  emitEvent('recording.done', {
    meetingId: meetingBot.meetingId,
    videoUrl: video_url,
    duration,
  });

  logger.info({ meetingId: meetingBot.meetingId, videoUrl: video_url }, 'Recording completed');
}

// ============================================
// EVENT EMITTER
// ============================================

/**
 * Register a handler for webhook events
 */
export function onWebhookEvent(event: string, handler: WebhookHandler): () => void {
  if (!eventHandlers.has(event)) {
    eventHandlers.set(event, []);
  }
  eventHandlers.get(event)!.push(handler);

  // Return unsubscribe function
  return () => {
    const handlers = eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  };
}

/**
 * Emit an event to all registered handlers
 */
function emitEvent(event: string, data: any): void {
  const handlers = eventHandlers.get(event) || [];
  for (const handler of handlers) {
    handler(data).catch(err => {
      logger.error({ err, event }, 'Error in webhook event handler');
    });
  }
}

// ============================================
// MAIN WEBHOOK PROCESSOR
// ============================================

/**
 * Process incoming webhook from Recall.ai
 */
export async function processWebhook(event: RecallWebhookEvent): Promise<void> {
  logger.debug({ eventType: event.event }, 'Processing Recall.ai webhook');

  switch (event.event) {
    case 'transcript.data':
      await handleTranscriptData(event.data as TranscriptDataEvent);
      break;
    
    case 'bot.status_change':
      await handleBotStatusChange(event.data as BotStatusChangeEvent);
      break;
    
    case 'recording.done':
      await handleRecordingDone(event.data as RecordingDoneEvent);
      break;
    
    default:
      logger.debug({ eventType: event.event }, 'Unhandled Recall.ai event');
  }
}

// Export webhook service
export const webhookService = {
  verifyWebhookSignature,
  processWebhook,
  onWebhookEvent,
};

export default webhookService;
