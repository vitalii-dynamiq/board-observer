/**
 * Recall.ai Bot Management Service
 * 
 * Handles bot lifecycle: creating, joining, leaving meetings.
 * Manages bot state in the database and coordinates with the Recall.ai API.
 */

import prisma from '../../lib/prisma';
import { botLogger as logger } from '../../lib/logger';
import { 
  createBot as recallCreateBot,
  getBot as recallGetBot,
  deleteBot as recallDeleteBot,
  leaveBot as recallLeaveBot,
  sendChatMessage,
  RecallBot,
  CreateBotOptions,
  RecallBotStatus,
} from './client';

// ============================================
// TYPES
// ============================================

export interface BotJoinOptions {
  meetingId: string;
  meetingUrl: string;
  botName?: string;
  webhookUrl: string;
  enableTranscription?: boolean;
  enableChat?: boolean;
  chatWelcomeMessage?: string;
}

export interface BotStatus {
  id: string;
  meetingId: string;
  recallBotId: string;
  status: string;
  joinedAt: Date | null;
  leftAt: Date | null;
  recallStatus?: RecallBotStatus;
}

// ============================================
// BOT MANAGEMENT
// ============================================

/**
 * Send a bot to join a meeting
 */
export async function joinMeeting(options: BotJoinOptions): Promise<BotStatus> {
  const {
    meetingId,
    meetingUrl,
    botName = 'Board Observer AI',
    webhookUrl,
    enableTranscription = true,
    enableChat = true,
    chatWelcomeMessage = 'Board Observer AI is now listening and will provide insights.',
  } = options;

  // Check if bot already exists for this meeting
  const existingBot = await prisma.meetingBot.findUnique({
    where: { meetingId },
  });

  if (existingBot && ['created', 'joining', 'in_meeting'].includes(existingBot.status)) {
    throw new Error(`Bot already active for meeting ${meetingId}`);
  }

  // Create bot options for Recall.ai
  const createOptions: CreateBotOptions = {
    meeting_url: meetingUrl,
    bot_name: botName,
  };

  // Add real-time transcription webhook if enabled
  if (enableTranscription && webhookUrl) {
    // Determine transcription provider
    // Recall.ai supported providers: meeting_captions, gladia, assembly_ai, rev, speechmatics
    // Note: Deepgram is not directly supported by Recall.ai
    const transcriptionProvider = process.env.TRANSCRIPTION_PROVIDER || 'assembly_ai';
    
    let providerConfig: any;
    
    if (transcriptionProvider === 'assembly_ai') {
      // AssemblyAI v3 Streaming: Real-time transcription with high accuracy
      // Supports speaker diarization, real-time streaming
      providerConfig = {
        assembly_ai_v3_streaming: {}, // v3 Real-time streaming version
      };
      logger.info({ provider: 'assembly_ai_v3_streaming' }, 'Using AssemblyAI for transcription');
    } else if (transcriptionProvider === 'deepgram') {
      // Deepgram Streaming: Fast, accurate real-time transcription
      providerConfig = {
        deepgram_streaming: {},
      };
      logger.info({ provider: 'deepgram_streaming' }, 'Using Deepgram for transcription');
    } else if (transcriptionProvider === 'gladia') {
      // Gladia: Good quality, fast
      providerConfig = {
        gladia_v2_streaming: {},
      };
      logger.info({ provider: 'gladia_v2_streaming' }, 'Using Gladia for transcription');
    } else if (transcriptionProvider === 'rev') {
      // Rev AI: Professional grade transcription
      providerConfig = {
        rev_streaming: {},
      };
      logger.info({ provider: 'rev_streaming' }, 'Using Rev for transcription');
    } else {
      // Fallback: Meeting captions (slower, less accurate but always works)
      providerConfig = {
        meeting_captions: {},
      };
      logger.info({ provider: 'meeting_captions' }, 'Using meeting captions for transcription (fallback)');
    }
    
    createOptions.recording_config = {
      transcript: {
        provider: providerConfig,
      },
      realtime_endpoints: [
        {
          type: 'webhook',
          url: webhookUrl,
          events: ['transcript.data', 'transcript.partial_data'],
        },
      ],
    };
  }

  // Create bot via Recall.ai API
  const recallBot = await recallCreateBot(createOptions);

  // Store bot in database
  const meetingBot = await prisma.meetingBot.upsert({
    where: { meetingId },
    create: {
      meetingId,
      recallBotId: recallBot.id,
      status: 'created',
    },
    update: {
      recallBotId: recallBot.id,
      status: 'created',
      joinedAt: null,
      leftAt: null,
    },
  });

  // Update meeting to indicate bot is joining
  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      isRecording: false, // Will be set to true when bot starts recording
    },
  });

  return {
    id: meetingBot.id,
    meetingId: meetingBot.meetingId,
    recallBotId: meetingBot.recallBotId,
    status: meetingBot.status,
    joinedAt: meetingBot.joinedAt,
    leftAt: meetingBot.leftAt,
    recallStatus: recallBot.status,
  };
}

/**
 * Remove bot from a meeting and fetch final recording
 */
export async function leaveMeeting(meetingId: string): Promise<void> {
  const meetingBot = await prisma.meetingBot.findUnique({
    where: { meetingId },
  });

  if (!meetingBot) {
    throw new Error(`No bot found for meeting ${meetingId}`);
  }

  // Fetch final recording info from Recall.ai before leaving
  let recordingUrl: string | null = null;
  let transcriptUrl: string | null = null;
  let recordingDuration: number = 0;
  
  try {
    const recallBot = await recallGetBot(meetingBot.recallBotId);
    
    // Get recording info if available
    if (recallBot.video_url) {
      recordingUrl = recallBot.video_url;
    }
    
    // Try to get recording details from status_changes
    // The actual recording URLs are usually available after the bot leaves
    logger.debug({ botId: meetingBot.recallBotId }, 'Fetching recording info');
  } catch (error: any) {
    logger.warn({ err: error }, 'Could not fetch final recording info');
  }

  // Tell bot to leave the call (don't delete, just leave)
  try {
    await recallLeaveBot(meetingBot.recallBotId);
  } catch (error: any) {
    // Bot might already be gone or unable to leave
    logger.warn({ err: error }, 'Failed to leave bot from Recall.ai');
  }

  // Update bot status in database
  await prisma.meetingBot.update({
    where: { id: meetingBot.id },
    data: {
      status: 'left',
      leftAt: new Date(),
      recordingUrl,
      transcriptUrl,
    },
  });

  // Update meeting recording status
  await prisma.meeting.update({
    where: { id: meetingId },
    data: {
      isRecording: false,
      recordingUrl,
      transcriptUrl,
    },
  });
  
  logger.info({ meetingId, recordingUrl: recordingUrl || 'pending' }, 'Bot left meeting');
}

/**
 * Get bot status for a meeting
 */
export async function getBotStatus(meetingId: string): Promise<BotStatus | null> {
  let meetingBot = await prisma.meetingBot.findUnique({
    where: { meetingId },
  });

  if (!meetingBot) {
    return null;
  }

  // Get current status from Recall.ai if bot is active
  let recallStatus: RecallBotStatus | undefined;
  if (['created', 'joining', 'waiting_room', 'in_meeting'].includes(meetingBot.status)) {
    try {
      const recallBot = await recallGetBot(meetingBot.recallBotId);
      recallStatus = recallBot.status;
      
      // Auto-update local status based on Recall.ai status
      if (recallStatus) {
        let shouldUpdate = false;
        let newStatus = meetingBot.status;
        let joinedAt = meetingBot.joinedAt;
        let leftAt = meetingBot.leftAt;

        if ((recallStatus === 'in_call_recording' || recallStatus === 'in_call_not_recording') 
            && meetingBot.status !== 'in_meeting') {
          newStatus = 'in_meeting';
          joinedAt = joinedAt || new Date();
          shouldUpdate = true;
        } else if (recallStatus === 'in_waiting_room' && meetingBot.status !== 'waiting_room') {
          newStatus = 'waiting_room';
          shouldUpdate = true;
        } else if (recallStatus === 'joining_call' && meetingBot.status !== 'joining') {
          newStatus = 'joining';
          shouldUpdate = true;
        } else if ((recallStatus === 'done' || recallStatus === 'fatal') && meetingBot.status !== 'left') {
          newStatus = 'left';
          leftAt = leftAt || new Date();
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          meetingBot = await prisma.meetingBot.update({
            where: { meetingId },
            data: { status: newStatus, joinedAt, leftAt },
          });
          logger.debug({ meetingId, status: meetingBot.status }, 'Auto-updated bot status');
        }
      }
    } catch (error) {
      // Bot might not exist anymore
      logger.warn({ err: error }, 'Failed to get bot status from Recall.ai');
    }
  }

  return {
    id: meetingBot.id,
    meetingId: meetingBot.meetingId,
    recallBotId: meetingBot.recallBotId,
    status: meetingBot.status,
    joinedAt: meetingBot.joinedAt,
    leftAt: meetingBot.leftAt,
    recallStatus,
  };
}

/**
 * Update bot status based on Recall.ai webhook event
 */
export async function updateBotStatus(
  recallBotId: string,
  recallStatus: RecallBotStatus,
  message?: string
): Promise<void> {
  const meetingBot = await prisma.meetingBot.findUnique({
    where: { recallBotId },
  });

  if (!meetingBot) {
    logger.warn({ recallBotId }, 'Bot not found for Recall ID');
    return;
  }

  // Map Recall status to our internal status
  let internalStatus: string;
  let joinedAt: Date | null = meetingBot.joinedAt;
  let leftAt: Date | null = meetingBot.leftAt;

  switch (recallStatus) {
    case 'ready':
    case 'joining_call':
      internalStatus = 'joining';
      break;
    case 'in_waiting_room':
      internalStatus = 'waiting_room';
      break;
    case 'in_call_not_recording':
    case 'in_call_recording':
      internalStatus = 'in_meeting';
      if (!joinedAt) {
        joinedAt = new Date();
      }
      break;
    case 'call_ended':
    case 'done':
    case 'analysis_done':
      internalStatus = 'completed';
      leftAt = new Date();
      break;
    case 'fatal':
      internalStatus = 'error';
      leftAt = new Date();
      break;
    case 'media_expired':
      internalStatus = 'expired';
      break;
    default:
      internalStatus = recallStatus;
  }

  // Update database
  await prisma.meetingBot.update({
    where: { id: meetingBot.id },
    data: {
      status: internalStatus,
      joinedAt,
      leftAt,
    },
  });

  // Update meeting recording status
  const isRecording = recallStatus === 'in_call_recording';
  await prisma.meeting.update({
    where: { id: meetingBot.meetingId },
    data: {
      isRecording,
    },
  });

  logger.info({ recallBotId, from: recallStatus, to: internalStatus }, 'Bot status updated');
}

/**
 * Send a chat message from the bot
 */
export async function sendBotMessage(
  meetingId: string,
  message: string
): Promise<void> {
  const meetingBot = await prisma.meetingBot.findUnique({
    where: { meetingId },
  });

  if (!meetingBot) {
    throw new Error(`No bot found for meeting ${meetingId}`);
  }

  if (meetingBot.status !== 'in_meeting') {
    throw new Error(`Bot is not in meeting (status: ${meetingBot.status})`);
  }

  await sendChatMessage(meetingBot.recallBotId, message, 'everyone');
}

/**
 * Fetch and store final recording info from Recall.ai
 * Call this after the bot has left to get recording URLs
 */
export async function fetchAndStoreRecording(meetingId: string): Promise<{
  recordingUrl: string | null;
  transcriptUrl: string | null;
  duration: number;
}> {
  const meetingBot = await prisma.meetingBot.findUnique({
    where: { meetingId },
  });

  if (!meetingBot) {
    throw new Error(`No bot found for meeting ${meetingId}`);
  }

  try {
    const recallBot = await recallGetBot(meetingBot.recallBotId);
    
    let recordingUrl: string | null = null;
    let transcriptUrl: string | null = null;
    let duration = 0;
    
    // Get video URL
    if (recallBot.video_url) {
      recordingUrl = recallBot.video_url;
    }
    
    // Get recording info from media_shortcuts if available
    const recordings = (recallBot as any).recordings;
    if (recordings && recordings.length > 0) {
      const recording = recordings[0];
      
      // Check video
      if (recording.media_shortcuts?.video_mixed?.data?.download_url) {
        recordingUrl = recording.media_shortcuts.video_mixed.data.download_url;
      }
      
      // Check transcript
      if (recording.media_shortcuts?.transcript?.data?.download_url) {
        transcriptUrl = recording.media_shortcuts.transcript.data.download_url;
      }
      
      // Calculate duration from timestamps
      if (recording.started_at && recording.completed_at) {
        const start = new Date(recording.started_at).getTime();
        const end = new Date(recording.completed_at).getTime();
        duration = Math.round((end - start) / 60000); // minutes
      }
    }
    
    // Update bot record
    await prisma.meetingBot.update({
      where: { meetingId },
      data: {
        recordingUrl,
        transcriptUrl,
      },
    });
    
    // Update meeting record
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        recordingUrl,
        transcriptUrl,
        recordingDuration: duration,
      },
    });
    
    logger.info({ meetingId, recordingUrl }, 'Stored recording for meeting');
    
    return { recordingUrl, transcriptUrl, duration };
  } catch (error: any) {
    logger.error({ err: error, meetingId }, 'Failed to fetch recording');
    return { recordingUrl: null, transcriptUrl: null, duration: 0 };
  }
}

/**
 * Get meeting recording info
 */
export async function getRecordingInfo(meetingId: string): Promise<{
  recordingUrl: string | null;
  transcriptUrl: string | null;
  duration: number;
  status: string;
}> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { bot: true },
  });

  if (!meeting) {
    throw new Error(`Meeting ${meetingId} not found`);
  }

  // If we have URLs stored, return them
  if (meeting.recordingUrl) {
    return {
      recordingUrl: meeting.recordingUrl,
      transcriptUrl: meeting.transcriptUrl,
      duration: meeting.recordingDuration,
      status: 'available',
    };
  }

  // If bot exists and meeting is done, try to fetch recording
  if (meeting.bot && ['left', 'completed'].includes(meeting.bot.status)) {
    const result = await fetchAndStoreRecording(meetingId);
    return {
      ...result,
      status: result.recordingUrl ? 'available' : 'processing',
    };
  }

  return {
    recordingUrl: null,
    transcriptUrl: null,
    duration: meeting.recordingDuration,
    status: meeting.bot?.status === 'in_meeting' ? 'recording' : 'not_started',
  };
}

// Export service object
export const botService = {
  joinMeeting,
  leaveMeeting,
  getBotStatus,
  updateBotStatus,
  sendBotMessage,
  fetchAndStoreRecording,
  getRecordingInfo,
};

export default botService;
