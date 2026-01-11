/**
 * Recall.ai API Client
 * 
 * Wrapper for the Recall.ai Meeting Bot API.
 * Handles authentication and provides typed methods for all API operations.
 * 
 * @see https://docs.recall.ai/
 */

const RECALL_API_URL = process.env.RECALL_API_URL || 'https://api.recall.ai/api/v1';
const RECALL_API_KEY = process.env.RECALL_API_KEY;

if (!RECALL_API_KEY) {
  console.warn('Warning: RECALL_API_KEY not set. Recall.ai integration will not work.');
}

// ============================================
// TYPES
// ============================================

export interface RecallBot {
  id: string;
  video_url: string | null;
  status: RecallBotStatus;
  status_changes: StatusChange[];
  meeting_metadata: MeetingMetadata | null;
  meeting_participants: MeetingParticipant[];
  speaker_timeline: SpeakerTimelineEntry[];
  meeting_url: string;
  bot_name: string;
  join_at: string | null;
  real_time_transcription: RealTimeTranscription | null;
  transcription_options: TranscriptionOptions | null;
  recording_mode: string;
  recording_mode_options: RecordingModeOptions;
  chat: ChatConfig | null;
  automatic_leave: AutomaticLeaveConfig;
  automatic_video_output: AutomaticVideoOutput | null;
  media_retention_end: string | null;
  created_at: string;
}

export type RecallBotStatus = 
  | 'ready'
  | 'joining_call'
  | 'in_waiting_room'
  | 'in_call_not_recording'
  | 'in_call_recording'
  | 'call_ended'
  | 'done'
  | 'fatal'
  | 'analysis_done'
  | 'media_expired';

export interface StatusChange {
  code: RecallBotStatus;
  message: string | null;
  created_at: string;
}

export interface MeetingMetadata {
  title: string | null;
  start_time: string | null;
  end_time: string | null;
}

export interface MeetingParticipant {
  id: number;
  name: string;
  events: ParticipantEvent[];
}

export interface ParticipantEvent {
  code: 'join' | 'leave';
  created_at: string;
}

export interface SpeakerTimelineEntry {
  name: string;
  user_id: number | null;
  timestamp: number;
}

export interface RealTimeTranscription {
  destination_url: string;
  partial_results: boolean;
}

export interface TranscriptionOptions {
  provider: string;
  language: string | null;
}

export interface RecordingModeOptions {
  participant_video_when_screenshare: string;
}

export interface ChatConfig {
  on_bot_join: { send_to: string; message: string } | null;
  on_participant_join: { send_to: string; message: string } | null;
}

export interface AutomaticLeaveConfig {
  waiting_room_timeout: number;
  noone_joined_timeout: number;
  everyone_left_timeout: number;
}

export interface AutomaticVideoOutput {
  in_call_recording: {
    kind: string;
    config?: any;
  };
}

// ============================================
// CREATE BOT OPTIONS
// ============================================

export interface CreateBotOptions {
  meeting_url: string;
  bot_name?: string;
  join_at?: string;
  recording_config?: {
    realtime_endpoints?: Array<{
      type: 'webhook';
      url: string;
      events?: string[];
    }>;
    transcript?: {
      provider?: {
        meeting_captions?: object; // Uses platform's built-in captions
        assembly_ai_streaming?: object;
        deepgram_streaming?: object;
        recallai_streaming?: object;
      };
    };
    video_mixed_layout?: 'speaker_view' | 'gallery_view';
  };
  chat?: {
    on_bot_join?: { send_to: 'everyone' | 'host'; message: string };
    on_participant_join?: { send_to: 'everyone' | 'host'; message: string };
  };
  automatic_leave?: {
    waiting_room_timeout?: number;
    noone_joined_timeout?: number;
    everyone_left_timeout?: number | { timeout: number; activate_after?: number | null };
  };
  metadata?: Record<string, any>;
}

// ============================================
// OUTPUT AUDIO OPTIONS
// ============================================

export interface OutputAudioOptions {
  kind: 'mp3' | 'wav';
  b64_data: string; // base64 encoded audio data
  sample_rate?: number;
}

export interface TextToSpeechOptions {
  text: string;
  voice?: string;
  speed?: number;
}

// ============================================
// API CLIENT
// ============================================

class RecallApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'RecallApiError';
  }
}

async function recallFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (!RECALL_API_KEY) {
    throw new RecallApiError('RECALL_API_KEY not configured', 500);
  }

  const url = `${RECALL_API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Token ${RECALL_API_KEY}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as { detail?: string };
    throw new RecallApiError(
      errorData.detail || `Recall API error: ${response.statusText}`,
      response.status,
      errorData
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// ============================================
// EXPORTED API METHODS
// ============================================

/**
 * Create a new bot and send it to join a meeting
 */
export async function createBot(options: CreateBotOptions): Promise<RecallBot> {
  return recallFetch<RecallBot>('/bot', {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

/**
 * Get bot details by ID
 */
export async function getBot(botId: string): Promise<RecallBot> {
  const bot = await recallFetch<RecallBot>(`/bot/${botId}`);
  
  // Recall.ai sometimes returns status as null, derive from status_changes
  if (!bot.status && bot.status_changes && bot.status_changes.length > 0) {
    bot.status = bot.status_changes[bot.status_changes.length - 1].code;
  }
  
  return bot;
}

/**
 * List all bots (with optional filters)
 */
export async function listBots(params?: {
  meeting_url?: string;
  status?: RecallBotStatus;
  cursor?: string;
}): Promise<{ results: RecallBot[]; next: string | null }> {
  const searchParams = new URLSearchParams();
  if (params?.meeting_url) searchParams.set('meeting_url', params.meeting_url);
  if (params?.status) searchParams.set('status__in', params.status);
  if (params?.cursor) searchParams.set('cursor', params.cursor);
  
  const query = searchParams.toString();
  return recallFetch(`/bot${query ? `?${query}` : ''}`);
}

/**
 * Remove a bot from a meeting (deletes the bot)
 */
export async function deleteBot(botId: string): Promise<void> {
  await recallFetch(`/bot/${botId}`, { method: 'DELETE' });
}

/**
 * Tell a bot to leave the meeting (keeps recording data)
 */
export async function leaveBot(botId: string): Promise<void> {
  await recallFetch(`/bot/${botId}/leave_call`, { method: 'POST' });
}

/**
 * Send a chat message from the bot
 */
export async function sendChatMessage(
  botId: string,
  message: string,
  to: 'everyone' | 'host' = 'everyone'
): Promise<void> {
  await recallFetch(`/bot/${botId}/send_chat_message`, {
    method: 'POST',
    body: JSON.stringify({ message, to }),
  });
}

/**
 * Output audio to the meeting (bot speaks)
 */
export async function outputAudio(
  botId: string,
  options: OutputAudioOptions
): Promise<void> {
  await recallFetch(`/bot/${botId}/output_audio`, {
    method: 'POST',
    body: JSON.stringify(options),
  });
}

/**
 * Get bot transcript (after meeting ends)
 */
export async function getTranscript(botId: string): Promise<{
  words: Array<{
    text: string;
    start_time: number;
    end_time: number;
    speaker: string | null;
    speaker_id: number | null;
    confidence: number;
  }>;
}> {
  return recallFetch(`/bot/${botId}/transcript`);
}

/**
 * Get bot recording URL
 */
export async function getRecording(botId: string): Promise<{
  video_url: string | null;
  audio_url: string | null;
}> {
  const bot = await getBot(botId);
  return {
    video_url: bot.video_url,
    audio_url: null, // Audio is part of video
  };
}

// Export error class for error handling
export { RecallApiError };

// Export default client object
export const recallClient = {
  createBot,
  getBot,
  listBots,
  deleteBot,
  sendChatMessage,
  outputAudio,
  getTranscript,
  getRecording,
};

export default recallClient;
