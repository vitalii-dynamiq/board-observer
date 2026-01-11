/**
 * Recall.ai Audio Output Service
 * 
 * Handles text-to-speech output for the bot to speak in meetings.
 * Supports both OpenAI TTS and ElevenLabs for voice synthesis.
 */

import OpenAI from 'openai';
import prisma from '../../lib/prisma';
import { outputAudio, sendChatMessage } from './client';
import { textToSpeech as elevenLabsTTS, isConfigured as isElevenLabsConfigured, PROFESSIONAL_VOICES } from '../elevenlabs/client';

// ============================================
// CONFIGURATION
// ============================================

const SPEAK_COOLDOWN_MS = parseInt(process.env.AGENT_SPEAK_COOLDOWN || '30') * 1000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TTS_PROVIDER = process.env.TTS_PROVIDER || 'openai'; // 'openai' or 'elevenlabs'

// OpenAI client for TTS
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// Track last speak time per meeting
const lastSpeakTime: Map<string, number> = new Map();

// ============================================
// TYPES
// ============================================

export interface SpeakOptions {
  meetingId: string;
  text: string;
  voice?: string; // Voice ID (OpenAI: alloy, echo, etc. | ElevenLabs: voice ID)
  speed?: number; // Only for OpenAI
  force?: boolean; // Bypass cooldown
  alsoChatMessage?: boolean; // Also send as chat message
}

export interface SpeakResult {
  success: boolean;
  spoken: boolean;
  chatSent: boolean;
  reason?: string;
}

// ============================================
// TTS GENERATION
// ============================================

/**
 * Generate audio from text using OpenAI TTS
 */
async function generateOpenAITTS(
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova',
  speed: number = 1.0
): Promise<Buffer> {
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }

  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
    speed,
    response_format: 'mp3',
  });

  // Get the audio data as a buffer
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generate audio from text using ElevenLabs TTS
 * ElevenLabs provides more natural-sounding voices
 */
async function generateElevenLabsTTS(
  text: string,
  voiceId?: string
): Promise<Buffer> {
  if (!isElevenLabsConfigured()) {
    throw new Error('ElevenLabs API key not configured');
  }

  // Use a professional voice for board meetings
  const selectedVoice = voiceId || PROFESSIONAL_VOICES.adam;

  return elevenLabsTTS(text, {
    voiceId: selectedVoice,
    voiceSettings: {
      stability: 0.6, // Slightly higher for professional context
      similarity_boost: 0.8,
    },
  });
}

/**
 * Generate TTS audio using configured provider
 */
async function generateTTSAudio(
  text: string,
  voice?: string,
  speed: number = 1.0
): Promise<Buffer> {
  const provider = TTS_PROVIDER.toLowerCase();

  if (provider === 'elevenlabs' && isElevenLabsConfigured()) {
    console.log('Using ElevenLabs TTS');
    // Don't pass OpenAI voice IDs to ElevenLabs - let it use default professional voice
    const elevenLabsVoice = (voice && !['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(voice)) 
      ? voice 
      : undefined; // Use default ElevenLabs voice
    return generateElevenLabsTTS(text, elevenLabsVoice);
  }

  if (openai) {
    console.log('Using OpenAI TTS');
    // Map OpenAI voice names
    const openAIVoice = (voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer') || 'nova';
    return generateOpenAITTS(text, openAIVoice, speed);
  }

  throw new Error('No TTS provider configured. Set OPENAI_API_KEY or ELEVENLABS_API_KEY.');
}

// ============================================
// SPEAK FUNCTIONALITY
// ============================================

/**
 * Check if the agent can speak (respects cooldown)
 */
function canSpeak(meetingId: string, force: boolean = false): { allowed: boolean; waitMs?: number } {
  if (force) {
    return { allowed: true };
  }

  const lastTime = lastSpeakTime.get(meetingId) || 0;
  const elapsed = Date.now() - lastTime;

  if (elapsed < SPEAK_COOLDOWN_MS) {
    return {
      allowed: false,
      waitMs: SPEAK_COOLDOWN_MS - elapsed,
    };
  }

  return { allowed: true };
}

/**
 * Make the bot speak in a meeting
 */
export async function speak(options: SpeakOptions): Promise<SpeakResult> {
  const {
    meetingId,
    text,
    voice = 'nova',
    speed = 1.0,
    force = false,
    alsoChatMessage = true,
  } = options;

  // Check cooldown
  const speakCheck = canSpeak(meetingId, force);
  if (!speakCheck.allowed) {
    console.log(`Speak cooldown active for meeting ${meetingId}, ${speakCheck.waitMs}ms remaining`);
    return {
      success: false,
      spoken: false,
      chatSent: false,
      reason: `Cooldown active, ${Math.round((speakCheck.waitMs || 0) / 1000)}s remaining`,
    };
  }

  // Find the bot for this meeting
  const meetingBot = await prisma.meetingBot.findUnique({
    where: { meetingId },
  });

  if (!meetingBot) {
    return {
      success: false,
      spoken: false,
      chatSent: false,
      reason: 'No bot found for meeting',
    };
  }

  if (meetingBot.status !== 'in_meeting') {
    return {
      success: false,
      spoken: false,
      chatSent: false,
      reason: `Bot not in meeting (status: ${meetingBot.status})`,
    };
  }

  let spoken = false;
  let chatSent = false;

  try {
    // Generate TTS audio
    console.log(`Generating TTS for: "${text.substring(0, 50)}..."`);
    const audioBuffer = await generateTTSAudio(text, voice, speed);
    const audioBase64 = audioBuffer.toString('base64');

    // Send audio to Recall.ai
    await outputAudio(meetingBot.recallBotId, {
      kind: 'mp3',
      b64_data: audioBase64,
    });

    spoken = true;
    lastSpeakTime.set(meetingId, Date.now());
    console.log(`Bot spoke in meeting ${meetingId}`);
  } catch (error: any) {
    console.error('Failed to output audio:', error.message);
    // Continue to try chat message
  }

  // Also send as chat message if requested
  if (alsoChatMessage) {
    try {
      await sendChatMessage(meetingBot.recallBotId, text, 'everyone');
      chatSent = true;
    } catch (error: any) {
      console.error('Failed to send chat message:', error.message);
    }
  }

  return {
    success: spoken || chatSent,
    spoken,
    chatSent,
  };
}

/**
 * Send only a chat message (no TTS)
 */
export async function sendMessage(
  meetingId: string,
  message: string
): Promise<boolean> {
  const meetingBot = await prisma.meetingBot.findUnique({
    where: { meetingId },
  });

  if (!meetingBot || meetingBot.status !== 'in_meeting') {
    return false;
  }

  try {
    await sendChatMessage(meetingBot.recallBotId, message, 'everyone');
    return true;
  } catch (error: any) {
    console.error('Failed to send chat message:', error.message);
    return false;
  }
}

/**
 * Queue multiple insights for speaking (with priority)
 */
const speakQueue: Map<string, Array<{ text: string; priority: number }>> = new Map();

export function queueSpeak(
  meetingId: string,
  text: string,
  priority: number = 0
): void {
  if (!speakQueue.has(meetingId)) {
    speakQueue.set(meetingId, []);
  }

  const queue = speakQueue.get(meetingId)!;
  queue.push({ text, priority });
  queue.sort((a, b) => b.priority - a.priority); // Higher priority first

  // Process queue
  processQueue(meetingId);
}

async function processQueue(meetingId: string): Promise<void> {
  const queue = speakQueue.get(meetingId);
  if (!queue || queue.length === 0) return;

  const speakCheck = canSpeak(meetingId);
  if (!speakCheck.allowed) {
    // Schedule retry
    setTimeout(() => processQueue(meetingId), speakCheck.waitMs);
    return;
  }

  const item = queue.shift();
  if (item) {
    await speak({
      meetingId,
      text: item.text,
      alsoChatMessage: true,
    });

    // Process next item after cooldown
    if (queue.length > 0) {
      setTimeout(() => processQueue(meetingId), SPEAK_COOLDOWN_MS);
    }
  }
}

/**
 * Clear speak queue for a meeting
 */
export function clearSpeakQueue(meetingId: string): void {
  speakQueue.delete(meetingId);
  lastSpeakTime.delete(meetingId);
}

// Export service
export const audioOutputService = {
  speak,
  sendMessage,
  queueSpeak,
  clearSpeakQueue,
  canSpeak,
};

export default audioOutputService;
