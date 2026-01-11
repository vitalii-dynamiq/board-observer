/**
 * Transcript Processing Service
 * 
 * Manages transcript buffering and processing for AI analysis.
 * Buffers incoming transcript chunks and sends them to the AI agent.
 */

import { onWebhookEvent } from './webhooks';

// ============================================
// TYPES
// ============================================

export interface TranscriptChunk {
  meetingId: string;
  speaker: string;
  speakerId: number | null;
  text: string;
  confidence: number;
  timestamp: Date;
  isFinal: boolean;
}

export interface BufferedTranscript {
  meetingId: string;
  chunks: TranscriptChunk[];
  fullText: string;
  speakers: Set<string>;
  startTime: Date;
  endTime: Date;
}

type TranscriptHandler = (transcript: BufferedTranscript) => Promise<void>;

// ============================================
// CONFIGURATION
// ============================================

const BUFFER_WINDOW_MS = parseInt(process.env.TRANSCRIPT_BUFFER_SECONDS || '5') * 1000;
const MIN_CHUNKS_TO_PROCESS = 2;

// ============================================
// BUFFER MANAGEMENT
// ============================================

// Active buffers per meeting
const meetingBuffers: Map<string, {
  chunks: TranscriptChunk[];
  timer: NodeJS.Timeout | null;
  handlers: TranscriptHandler[];
}> = new Map();

/**
 * Initialize transcript processing for a meeting
 */
export function startTranscriptProcessing(
  meetingId: string,
  handler: TranscriptHandler
): () => void {
  if (!meetingBuffers.has(meetingId)) {
    meetingBuffers.set(meetingId, {
      chunks: [],
      timer: null,
      handlers: [],
    });
  }

  const buffer = meetingBuffers.get(meetingId)!;
  buffer.handlers.push(handler);

  // Return cleanup function
  return () => {
    const buf = meetingBuffers.get(meetingId);
    if (buf) {
      const index = buf.handlers.indexOf(handler);
      if (index > -1) {
        buf.handlers.splice(index, 1);
      }
      
      // Clean up if no handlers left
      if (buf.handlers.length === 0) {
        if (buf.timer) {
          clearTimeout(buf.timer);
        }
        meetingBuffers.delete(meetingId);
      }
    }
  };
}

/**
 * Stop transcript processing for a meeting
 */
export function stopTranscriptProcessing(meetingId: string): void {
  const buffer = meetingBuffers.get(meetingId);
  if (buffer) {
    if (buffer.timer) {
      clearTimeout(buffer.timer);
    }
    
    // Process any remaining chunks
    if (buffer.chunks.length > 0) {
      processBuffer(meetingId, true);
    }
    
    meetingBuffers.delete(meetingId);
  }
}

/**
 * Add a transcript chunk to the buffer
 */
function addChunk(chunk: TranscriptChunk): void {
  const { meetingId } = chunk;
  
  if (!meetingBuffers.has(meetingId)) {
    // No active processing for this meeting
    return;
  }

  const buffer = meetingBuffers.get(meetingId)!;
  buffer.chunks.push(chunk);

  // Reset the buffer timer
  if (buffer.timer) {
    clearTimeout(buffer.timer);
  }

  buffer.timer = setTimeout(() => {
    processBuffer(meetingId, false);
  }, BUFFER_WINDOW_MS);
}

/**
 * Process the buffered transcript
 */
async function processBuffer(meetingId: string, force: boolean): Promise<void> {
  const buffer = meetingBuffers.get(meetingId);
  if (!buffer || buffer.chunks.length === 0) {
    return;
  }

  // Don't process if we don't have enough chunks (unless forced)
  if (!force && buffer.chunks.length < MIN_CHUNKS_TO_PROCESS) {
    return;
  }

  // Get and clear chunks
  const chunks = [...buffer.chunks];
  buffer.chunks = [];
  buffer.timer = null;

  // Build buffered transcript
  const speakers = new Set<string>();
  let fullText = '';
  
  for (const chunk of chunks) {
    speakers.add(chunk.speaker);
    if (fullText) fullText += ' ';
    fullText += `[${chunk.speaker}]: ${chunk.text}`;
  }

  const bufferedTranscript: BufferedTranscript = {
    meetingId,
    chunks,
    fullText,
    speakers,
    startTime: chunks[0].timestamp,
    endTime: chunks[chunks.length - 1].timestamp,
  };

  // Notify all handlers
  for (const handler of buffer.handlers) {
    try {
      await handler(bufferedTranscript);
    } catch (error) {
      console.error('Error in transcript handler:', error);
    }
  }
}

// ============================================
// WEBHOOK INTEGRATION
// ============================================

/**
 * Initialize webhook event listeners
 * Call this after the webhook service is ready
 */
export function initTranscriptWebhooks(): void {
  // Listen for transcript events from webhooks
  onWebhookEvent('transcript.final', async (data) => {
    const chunk: TranscriptChunk = {
      meetingId: data.meetingId,
      speaker: data.speaker || 'Unknown',
      speakerId: data.speakerId,
      text: data.text,
      confidence: data.confidence,
      timestamp: new Date(data.timestamp),
      isFinal: true,
    };

    addChunk(chunk);
  });

  // Also handle partial transcripts for live display
  onWebhookEvent('transcript.partial', async (data) => {
    const chunk: TranscriptChunk = {
      meetingId: data.meetingId,
      speaker: data.speaker || 'Unknown',
      speakerId: data.speakerId,
      text: data.text,
      confidence: 0.5, // Lower confidence for partials
      timestamp: new Date(),
      isFinal: false,
    };

    // Partials are only for display, not buffered for AI
    // They'll be emitted directly via WebSocket
  });
  
  console.log('[TRANSCRIPTION] Webhook event listeners initialized');
}

// ============================================
// CONTEXT MANAGEMENT
// ============================================

/**
 * Get recent transcript context for a meeting
 */
export async function getRecentTranscript(
  meetingId: string,
  limit: number = 20
): Promise<string> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    const entries = await prisma.transcriptEntry.findMany({
      where: { meetingId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    // Reverse to get chronological order
    entries.reverse();

    return entries
      .map(e => `[${e.speakerName}]: ${e.content}`)
      .join('\n');
  } finally {
    await prisma.$disconnect();
  }
}

// Export service
export const transcriptionService = {
  startTranscriptProcessing,
  stopTranscriptProcessing,
  getRecentTranscript,
  initTranscriptWebhooks,
};

export default transcriptionService;
