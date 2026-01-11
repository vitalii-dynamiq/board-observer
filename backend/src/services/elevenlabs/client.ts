/**
 * ElevenLabs API Client
 * 
 * Provides text-to-speech functionality using ElevenLabs' voice synthesis API.
 * This is an alternative to OpenAI TTS with more natural-sounding voices.
 */

// ============================================
// CONFIGURATION
// ============================================

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

// Default voice settings
const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam - professional male voice

// ElevenLabs Models (latest to oldest):
// - eleven_flash_v2_5: Ultra low latency (~75ms), best for real-time
// - eleven_turbo_v2_5: Low latency (~135ms), good balance
// - eleven_multilingual_v2: Higher quality but slower
// - eleven_v3_alpha: Most expressive but high latency (not for real-time)
const DEFAULT_MODEL_ID = process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5';

// ============================================
// TYPES
// ============================================

export interface VoiceSettings {
  stability: number; // 0-1, higher = more consistent
  similarity_boost: number; // 0-1, higher = closer to original voice
  style?: number; // 0-1, for supported models
  use_speaker_boost?: boolean;
}

export interface TTSOptions {
  voiceId?: string;
  modelId?: string;
  voiceSettings?: Partial<VoiceSettings>;
  outputFormat?: 'mp3_44100_128' | 'mp3_44100_64' | 'pcm_16000' | 'pcm_22050' | 'pcm_24000' | 'pcm_44100';
}

export interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description?: string;
  preview_url?: string;
  labels?: Record<string, string>;
}

export class ElevenLabsError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ElevenLabsError';
  }
}

// ============================================
// API HELPERS
// ============================================

async function elevenLabsFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!ELEVENLABS_API_KEY) {
    throw new ElevenLabsError('ELEVENLABS_API_KEY not configured', 500);
  }

  const url = `${ELEVENLABS_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { detail?: { message?: string } };
    throw new ElevenLabsError(
      errorData.detail?.message || `ElevenLabs API error: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  return response.json() as Promise<T>;
}

async function elevenLabsFetchBinary(
  endpoint: string,
  options: RequestInit = {}
): Promise<Buffer> {
  if (!ELEVENLABS_API_KEY) {
    throw new ElevenLabsError('ELEVENLABS_API_KEY not configured', 500);
  }

  const url = `${ELEVENLABS_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { detail?: { message?: string } };
    throw new ElevenLabsError(
      errorData.detail?.message || `ElevenLabs API error: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ============================================
// API METHODS
// ============================================

/**
 * Check if ElevenLabs is configured
 */
export function isConfigured(): boolean {
  return !!ELEVENLABS_API_KEY;
}

/**
 * Get available voices
 */
export async function getVoices(): Promise<Voice[]> {
  const response = await elevenLabsFetch<{ voices: Voice[] }>('/voices');
  return response.voices;
}

/**
 * Text to speech conversion
 */
export async function textToSpeech(
  text: string,
  options: TTSOptions = {}
): Promise<Buffer> {
  const {
    voiceId = DEFAULT_VOICE_ID,
    modelId = DEFAULT_MODEL_ID,
    voiceSettings = {},
    outputFormat = 'mp3_44100_128',
  } = options;

  const defaultSettings: VoiceSettings = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
  };

  const body = {
    text,
    model_id: modelId,
    voice_settings: { ...defaultSettings, ...voiceSettings },
  };

  return elevenLabsFetchBinary(
    `/text-to-speech/${voiceId}?output_format=${outputFormat}`,
    {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Accept': 'audio/mpeg',
      },
    }
  );
}

/**
 * Text to speech with streaming (for real-time output)
 */
export async function textToSpeechStream(
  text: string,
  options: TTSOptions = {}
): Promise<ReadableStream<Uint8Array>> {
  if (!ELEVENLABS_API_KEY) {
    throw new ElevenLabsError('ELEVENLABS_API_KEY not configured', 500);
  }

  const {
    voiceId = DEFAULT_VOICE_ID,
    modelId = DEFAULT_MODEL_ID,
    voiceSettings = {},
    outputFormat = 'mp3_44100_128',
  } = options;

  const defaultSettings: VoiceSettings = {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
  };

  const url = `${ELEVENLABS_API_URL}/text-to-speech/${voiceId}/stream?output_format=${outputFormat}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: { ...defaultSettings, ...voiceSettings },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { detail?: { message?: string } };
    throw new ElevenLabsError(
      errorData.detail?.message || `ElevenLabs API error: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  if (!response.body) {
    throw new ElevenLabsError('No response body', 500);
  }

  return response.body;
}

/**
 * Get usage information for the current subscription
 */
export async function getUsage(): Promise<{
  character_count: number;
  character_limit: number;
  can_extend_character_limit: boolean;
  allowed_to_extend_character_limit: boolean;
}> {
  return elevenLabsFetch('/user/subscription');
}

// ============================================
// PROFESSIONAL VOICES FOR BUSINESS SETTINGS
// ============================================

export const PROFESSIONAL_VOICES = {
  // Male voices - recommended for professional settings
  adam: 'pNInz6obpgDQGcFmaJgB',      // Deep, professional male (default)
  josh: 'TxGEqnHWrfWFTfGW9XjX',      // Deep, clear male - great for meetings
  arnold: 'VR6AewLTigWG4xSOukaG',    // Authoritative male
  brian: 'nPczCjzI2devNBz1zQrb',     // Deep American male - very natural
  
  // Female voices
  rachel: '21m00Tcm4TlvDq8ikWAM',    // Professional female
  domi: 'AZnzlk1XvdvUeBnXmlld',      // Strong, confident female
  bella: 'EXAVITQu4vr4xnSDxMaL',     // Soft, professional female
  matilda: 'XrExE9yKIg1WjnnlVkGX',   // Warm, friendly female
  
  // Neutral/conversational
  chris: 'iP95p4xoKVk53GoZ742B',     // Casual American male
  charlie: 'IKne3meq5aSn9XLyUdCD',   // Natural Australian male
  george: 'JBFqnCBsd6RMkjVDRZzb',    // Warm British male
};

// Export client
export const elevenlabsClient = {
  isConfigured,
  getVoices,
  textToSpeech,
  textToSpeechStream,
  getUsage,
  PROFESSIONAL_VOICES,
};

export default elevenlabsClient;
