/**
 * Wake Word & Intelligent Listening Service
 * 
 * Provides human-like conversational awareness:
 * - Detects when being addressed
 * - Understands speech patterns and natural pauses
 * - Waits for complete thoughts before responding
 * - Handles interruptions gracefully
 */

import prisma from '../../lib/prisma';
import { askAdvisor } from '../openai/advisor-agent';
import { speak } from '../recall/audio-output';

// ============================================
// CONFIGURATION
// ============================================

// Wake word phrases (case-insensitive)
const WAKE_PHRASES = [
  'board observer',
  'hey board observer',
  'hey observer',
  'observer',
  'board observer ai',
  'hey ai',
  'ok observer',
];

// Patterns that indicate the speaker is still talking
const CONTINUATION_PATTERNS = [
  /\b(and|but|or|so|because|however|also|then|if|when|while|although|though|unless|since|before|after|that|which|who|where|what|how|why)\s*$/i,
  /,\s*$/,  // Ends with comma
  /\.\.\.\s*$/,  // Ellipsis
  /-\s*$/,  // Dash (interrupted thought)
];

// Patterns that indicate the speaker has finished
const COMPLETION_PATTERNS = [
  /\?\s*$/,  // Question mark - strong completion signal
  /\.\s*$/,  // Period - statement complete
  /!\s*$/,  // Exclamation
  /please\s*$/i,  // "please" often ends requests
  /thanks\s*$/i,  // "thanks" often ends
  /thank you\s*$/i,
];

// Timing configuration (in milliseconds)
// IMPORTANT: Google Meet captions can be delayed 2-5 seconds!
const TIMING = {
  // Minimum pause to consider as potential end of speech
  MIN_PAUSE: 1500,
  
  // Standard pause for most utterances (wait longer for delayed captions)
  STANDARD_PAUSE: 3000,
  
  // Longer pause for complex questions/statements
  LONG_PAUSE: 4000,
  
  // Quick response pause if we detect clear completion (question mark, etc)
  QUICK_RESPONSE_PAUSE: 2000,
  
  // Maximum time to wait for speech
  MAX_LISTEN_TIME: 30000,
  
  // Cooldown between responses
  RESPONSE_COOLDOWN: 5000,
  
  // Time window to consider speech as "continuous" from same speaker
  // Google Meet captions can have 5+ second gaps between chunks!
  SPEECH_CONTINUITY_WINDOW: 8000,
};

// ============================================
// TYPES
// ============================================

interface SpeechChunk {
  text: string;
  speaker: string;
  timestamp: number;
}

interface ListeningSession {
  // Session state
  isActive: boolean;
  startTime: number;
  lastSpeechTime: number;
  
  // Speaker tracking
  primarySpeaker: string;
  
  // Speech buffer
  chunks: SpeechChunk[];
  
  // Timers
  pauseTimer: NodeJS.Timeout | null;
  maxTimeTimer: NodeJS.Timeout | null;
  
  // Analysis
  detectedCompletion: boolean;
  completionConfidence: number;
}

interface MeetingState {
  // Mute control
  isMuted: boolean;
  
  // Response tracking
  lastResponseTime: number;
  isProcessing: boolean;
  
  // Current listening session
  session: ListeningSession | null;
}

// ============================================
// STATE MANAGEMENT
// ============================================

const meetingStates: Map<string, MeetingState> = new Map();

function getState(meetingId: string): MeetingState {
  if (!meetingStates.has(meetingId)) {
    meetingStates.set(meetingId, {
      isMuted: false,
      lastResponseTime: 0,
      isProcessing: false,
      session: null,
    });
  }
  return meetingStates.get(meetingId)!;
}

function createSession(speaker: string): ListeningSession {
  return {
    isActive: true,
    startTime: Date.now(),
    lastSpeechTime: Date.now(),
    primarySpeaker: speaker,
    chunks: [],
    pauseTimer: null,
    maxTimeTimer: null,
    detectedCompletion: false,
    completionConfidence: 0,
  };
}

// ============================================
// MUTE CONTROL
// ============================================

export function muteBot(meetingId: string): void {
  const state = getState(meetingId);
  state.isMuted = true;
  endSession(meetingId, 'muted');
  console.log(`[LISTEN] Bot muted for meeting ${meetingId}`);
}

export function unmuteBot(meetingId: string): void {
  const state = getState(meetingId);
  state.isMuted = false;
  console.log(`[LISTEN] Bot unmuted for meeting ${meetingId}`);
}

export function isMuted(meetingId: string): boolean {
  return getState(meetingId).isMuted;
}

export function toggleMute(meetingId: string): boolean {
  const state = getState(meetingId);
  state.isMuted = !state.isMuted;
  if (state.isMuted) {
    endSession(meetingId, 'muted');
  }
  return state.isMuted;
}

// ============================================
// WAKE WORD DETECTION
// ============================================

function containsWakePhrase(text: string): boolean {
  const lowerText = text.toLowerCase().replace(/[,\.]/g, ' ').replace(/\s+/g, ' ');
  
  // Direct matching
  for (const phrase of WAKE_PHRASES) {
    if (lowerText.includes(phrase)) {
      return true;
    }
  }
  
  // Fuzzy matching for caption variations
  const patterns = [
    /\bboard\s+observer\b/i,
    /\bhey\s+observer\b/i,
    /\bok\s+observer\b/i,
    /\bobserver\s+ai\b/i,
  ];
  
  return patterns.some(p => p.test(text));
}

function removeWakePhrase(text: string): string {
  let result = text;
  
  // Remove wake phrases - be more careful to not remove too much
  const patterns = [
    /^hey\s*,?\s*board\s*,?\s*observer\s*[,.\s]*/i,
    /^board\s*,?\s*observer\s*,?\s*ai\s*[,.\s]*/i,
    /^board\s*[,.]?\s*observer\s*[,.\s]*/i,
    /^hey\s*,?\s*observer\s*[,.\s]*/i,
    /^ok\s*,?\s*observer\s*[,.\s]*/i,
    /^observer\s*,?\s*ai\s*[,.\s]*/i,
    /^observer\s*[,.\s]*/i,
    // Also handle wake phrase in the middle (less common)
    /\bhey\s*,?\s*board\s*,?\s*observer\s*[,.\s]*/gi,
    /\bboard\s*[,.]?\s*observer\s*[,.\s]*/gi,
  ];
  
  for (const pattern of patterns) {
    result = result.replace(pattern, ' ');
  }
  
  // Clean up extra spaces
  result = result.replace(/\s+/g, ' ').trim();
  
  // If we removed everything, return original (something went wrong)
  if (result.length < 2 && text.length > 20) {
    console.log(`[LISTEN] ⚠️ Wake phrase removal too aggressive, using original`);
    return text;
  }
  
  return result;
}

// ============================================
// SPEECH ANALYSIS
// ============================================

/**
 * Analyze speech to determine if the speaker has finished
 */
function analyzeCompletion(chunks: SpeechChunk[]): { 
  isComplete: boolean; 
  confidence: number; 
  suggestedPause: number;
} {
  if (chunks.length === 0) {
    return { isComplete: false, confidence: 0, suggestedPause: TIMING.STANDARD_PAUSE };
  }
  
  // Get full text
  const fullText = chunks.map(c => c.text).join(' ').trim();
  const lastChunk = chunks[chunks.length - 1].text.trim();
  
  // Remove wake phrase for analysis
  const questionText = removeWakePhrase(fullText);
  const wordCount = questionText.split(/\s+/).filter(w => w.length > 0).length;
  
  let confidence = 0;
  let suggestedPause = TIMING.STANDARD_PAUSE;
  
  // Check for strong completion signals
  for (const pattern of COMPLETION_PATTERNS) {
    if (pattern.test(lastChunk) || pattern.test(fullText)) {
      confidence += 0.4;
      suggestedPause = TIMING.QUICK_RESPONSE_PAUSE;
    }
  }
  
  // Check for continuation signals (reduces confidence)
  for (const pattern of CONTINUATION_PATTERNS) {
    if (pattern.test(lastChunk)) {
      confidence -= 0.3;
      suggestedPause = TIMING.LONG_PAUSE;
    }
  }
  
  // Word count heuristics
  if (wordCount >= 5) {
    confidence += 0.2; // Longer utterances more likely complete
  }
  if (wordCount >= 10) {
    confidence += 0.1;
  }
  if (wordCount < 3) {
    confidence -= 0.2; // Very short - probably not done
    suggestedPause = TIMING.LONG_PAUSE;
  }
  
  // Question detection
  if (/\?/.test(fullText)) {
    confidence += 0.3;
    suggestedPause = TIMING.QUICK_RESPONSE_PAUSE;
  }
  
  // Common question starters that need completion
  if (/^(what|how|why|when|where|who|can you|could you|would you|will you)/i.test(questionText)) {
    if (wordCount < 4) {
      confidence -= 0.2; // Question started but not finished
    } else {
      confidence += 0.1;
    }
  }
  
  // Normalize confidence
  confidence = Math.max(0, Math.min(1, confidence));
  
  // High confidence = complete
  const isComplete = confidence >= 0.5;
  
  return { isComplete, confidence, suggestedPause };
}

/**
 * Check if new speech is from the same speaker within continuity window
 */
function isContinuousSpeech(session: ListeningSession, speaker: string, now: number): boolean {
  if (speaker !== session.primarySpeaker) {
    return false;
  }
  
  const timeSinceLastSpeech = now - session.lastSpeechTime;
  return timeSinceLastSpeech < TIMING.SPEECH_CONTINUITY_WINDOW;
}

// ============================================
// SESSION MANAGEMENT
// ============================================

/**
 * Start a new listening session
 */
function startSession(meetingId: string, speaker: string, initialText: string): void {
  const state = getState(meetingId);
  
  // End any existing session
  if (state.session) {
    endSession(meetingId, 'new_session');
  }
  
  // Create new session
  const session = createSession(speaker);
  session.chunks.push({
    text: initialText,
    speaker,
    timestamp: Date.now(),
  });
  
  state.session = session;
  
  console.log(`[LISTEN] 🎤 Started listening to ${speaker}`);
  console.log(`[LISTEN] Initial: "${initialText}"`);
  
  // Set max time limit
  session.maxTimeTimer = setTimeout(() => {
    console.log(`[LISTEN] ⏰ Max listen time reached`);
    processAndRespond(meetingId);
  }, TIMING.MAX_LISTEN_TIME);
  
  // Start pause detection
  schedulePauseCheck(meetingId);
}

/**
 * Add speech to current session
 */
function addSpeech(meetingId: string, speaker: string, text: string): void {
  const state = getState(meetingId);
  const session = state.session;
  
  if (!session || !session.isActive) return;
  
  const now = Date.now();
  
  // Skip bot's own speech
  if (speaker === 'Unknown' || speaker.toLowerCase().includes('observer')) {
    console.log(`[LISTEN] 🤖 Skipping bot speech: "${text.substring(0, 30)}..."`);
    return;
  }
  
  // Accept speech from the primary speaker OR if very close in time
  // (Google Meet sometimes mis-attributes speakers)
  const timeSinceLastSpeech = now - session.lastSpeechTime;
  const isFromPrimarySpeaker = speaker === session.primarySpeaker;
  const isCloseInTime = timeSinceLastSpeech < TIMING.SPEECH_CONTINUITY_WINDOW;
  
  if (isFromPrimarySpeaker || isCloseInTime) {
    session.chunks.push({ text, speaker, timestamp: now });
    session.lastSpeechTime = now;
    
    // Update primary speaker if different (handle mis-attribution)
    if (!isFromPrimarySpeaker && isCloseInTime) {
      console.log(`[LISTEN] 📝 Buffered (possible mis-attribution): "${text}"`);
    } else {
      console.log(`[LISTEN] 📝 Buffered: "${text}"`);
    }
    
    // Reset pause detection
    schedulePauseCheck(meetingId);
  } else {
    // Someone else is speaking after a long gap
    console.log(`[LISTEN] 👥 Other speaker after ${timeSinceLastSpeech}ms (${speaker}): "${text.substring(0, 30)}..."`);
  }
}

/**
 * Schedule pause detection check
 */
function schedulePauseCheck(meetingId: string): void {
  const state = getState(meetingId);
  const session = state.session;
  
  if (!session || !session.isActive) return;
  
  // Clear existing timer
  if (session.pauseTimer) {
    clearTimeout(session.pauseTimer);
  }
  
  // Analyze current state
  const analysis = analyzeCompletion(session.chunks);
  session.detectedCompletion = analysis.isComplete;
  session.completionConfidence = analysis.confidence;
  
  const pauseDuration = analysis.isComplete 
    ? analysis.suggestedPause 
    : TIMING.STANDARD_PAUSE;
  
  console.log(`[LISTEN] 🔍 Completion: ${(analysis.confidence * 100).toFixed(0)}% confident, pause: ${pauseDuration}ms`);
  
  // Schedule pause check
  session.pauseTimer = setTimeout(() => {
    checkPauseAndRespond(meetingId);
  }, pauseDuration);
}

/**
 * Check if pause indicates end of speech
 */
function checkPauseAndRespond(meetingId: string): void {
  const state = getState(meetingId);
  const session = state.session;
  
  if (!session || !session.isActive) return;
  
  const now = Date.now();
  const timeSinceLastSpeech = now - session.lastSpeechTime;
  
  // Re-analyze for final decision
  const analysis = analyzeCompletion(session.chunks);
  
  console.log(`[LISTEN] ⏸️ Pause detected: ${timeSinceLastSpeech}ms, confidence: ${(analysis.confidence * 100).toFixed(0)}%`);
  
  // Get the question text
  const fullText = session.chunks.map(c => c.text).join(' ');
  const questionText = removeWakePhrase(fullText).trim();
  const wordCount = questionText.split(/\s+/).filter(w => w.length > 0).length;
  
  // Decision logic
  if (wordCount < 2 && timeSinceLastSpeech < TIMING.LONG_PAUSE) {
    // Very short and pause not long enough - keep waiting
    console.log(`[LISTEN] ⏳ Short utterance, waiting longer...`);
    schedulePauseCheck(meetingId);
    return;
  }
  
  if (analysis.confidence < 0.3 && timeSinceLastSpeech < TIMING.LONG_PAUSE) {
    // Low confidence and not a long pause - keep waiting
    console.log(`[LISTEN] ⏳ Low confidence, waiting longer...`);
    session.pauseTimer = setTimeout(() => {
      checkPauseAndRespond(meetingId);
    }, TIMING.MIN_PAUSE);
    return;
  }
  
  // Good enough - respond!
  console.log(`[LISTEN] ✅ Speech complete, responding...`);
  processAndRespond(meetingId);
}

/**
 * Process buffered speech and respond
 */
async function processAndRespond(meetingId: string): Promise<void> {
  const state = getState(meetingId);
  const session = state.session;
  
  if (!session || !session.isActive) return;
  
  // End session
  endSession(meetingId, 'responding');
  
  // Get full text
  const fullText = session.chunks.map(c => c.text).join(' ');
  const questionText = removeWakePhrase(fullText).trim();
  
  console.log(`[LISTEN] 💬 Full utterance: "${fullText}"`);
  console.log(`[LISTEN] ❓ Question: "${questionText}"`);
  
  // Check if there's a real question
  const wordCount = questionText.split(/\s+/).filter(w => w.length > 0).length;
  
  console.log(`[LISTEN] 📊 Word count: ${wordCount}, question: "${questionText}"`);
  
  // Be more lenient - even 1 word like "summarize" or "help" is enough
  if (wordCount < 1 || questionText.length < 3) {
    // Just wake word, no question
    console.log(`[LISTEN] 👋 Just wake word (${wordCount} words), prompting for question`);
    
    await speak({
      meetingId,
      text: "Yes, I'm here. Go ahead with your question.",
      force: true,
      alsoChatMessage: true,
    });
    
    state.lastResponseTime = Date.now();
    return;
  }
  
  // Process the question
  state.isProcessing = true;
  
  try {
    console.log(`[LISTEN] 🤖 Processing question...`);
    
    const response = await askAdvisor(meetingId, questionText);
    
    if (response && response.length > 0) {
      await speak({
        meetingId,
        text: response,
        force: true,
        alsoChatMessage: true,
      });
      
      console.log(`[LISTEN] ✨ Responded: "${response.substring(0, 60)}..."`);
    }
    
    state.lastResponseTime = Date.now();
  } catch (error) {
    console.error('[LISTEN] ❌ Error processing:', error);
    
    await speak({
      meetingId,
      text: "I'm sorry, I had trouble understanding that. Could you please repeat?",
      force: true,
      alsoChatMessage: true,
    });
  } finally {
    state.isProcessing = false;
  }
}

/**
 * End the current listening session
 */
function endSession(meetingId: string, reason: string): void {
  const state = getState(meetingId);
  const session = state.session;
  
  if (!session) return;
  
  // Clear timers
  if (session.pauseTimer) {
    clearTimeout(session.pauseTimer);
  }
  if (session.maxTimeTimer) {
    clearTimeout(session.maxTimeTimer);
  }
  
  session.isActive = false;
  state.session = null;
  
  console.log(`[LISTEN] 🔚 Session ended: ${reason}`);
}

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Process incoming transcript for wake words and questions
 */
export async function processForWakeWord(
  meetingId: string,
  speaker: string,
  text: string
): Promise<{ detected: boolean; responded: boolean; response?: string }> {
  const state = getState(meetingId);
  
  // Check if muted
  if (state.isMuted) {
    return { detected: false, responded: false };
  }
  
  // Check if currently processing
  if (state.isProcessing) {
    return { detected: false, responded: false };
  }
  
  // If we have an active session, add to it
  if (state.session?.isActive) {
    addSpeech(meetingId, speaker, text);
    return { detected: true, responded: false };
  }
  
  // Check for wake phrase
  const hasWakePhrase = containsWakePhrase(text);
  
  if (!hasWakePhrase) {
    return { detected: false, responded: false };
  }
  
  // Check cooldown
  const now = Date.now();
  if (now - state.lastResponseTime < TIMING.RESPONSE_COOLDOWN) {
    const remaining = Math.round((TIMING.RESPONSE_COOLDOWN - (now - state.lastResponseTime)) / 1000);
    console.log(`[LISTEN] ⏳ Cooldown active (${remaining}s remaining)`);
    return { detected: true, responded: false };
  }
  
  // Start new listening session
  console.log(`[LISTEN] 🎯 Wake word detected from ${speaker}`);
  startSession(meetingId, speaker, text);
  
  return { detected: true, responded: false };
}

// ============================================
// UTILITY EXPORTS
// ============================================

export function isListening(meetingId: string): boolean {
  return getState(meetingId).session?.isActive ?? false;
}

export function cancelListening(meetingId: string): void {
  endSession(meetingId, 'cancelled');
}

export async function acknowledgeWake(meetingId: string): Promise<void> {
  await speak({
    meetingId,
    text: "Yes?",
    force: true,
    alsoChatMessage: false,
  });
}

export function cleanupMeeting(meetingId: string): void {
  endSession(meetingId, 'cleanup');
  meetingStates.delete(meetingId);
}

// ============================================
// SERVICE EXPORT
// ============================================

export const wakeWordService = {
  muteBot,
  unmuteBot,
  isMuted,
  toggleMute,
  processForWakeWord,
  isListening,
  cancelListening,
  acknowledgeWake,
  cleanupMeeting,
};

export default wakeWordService;
