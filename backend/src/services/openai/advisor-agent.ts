/**
 * OpenAI Advisor Agent Service
 * 
 * The Advisor agent analyzes meeting transcripts in real-time and provides:
 * - Strategic recommendations
 * - Risk alerts
 * - Clarifying questions
 * - Contextual information
 */

import prisma from '../../lib/prisma';
import { createCompletion, ChatMessage, isConfigured } from './client';
import { 
  ADVISOR_SYSTEM_PROMPT,
  CHAT_ASSISTANT_PROMPT, 
  buildMeetingContext, 
  parseAgentResponse,
  ParsedAgentResponse,
} from './prompts';
import { BufferedTranscript, startTranscriptProcessing, stopTranscriptProcessing } from '../recall/transcription';
import { speak, queueSpeak } from '../recall/audio-output';

// ============================================
// TYPES
// ============================================

export interface AdvisorConfig {
  enabled: boolean;
  speakEnabled: boolean;
  speakHighPriorityOnly: boolean;
  minConfidence: number;
}

export interface AdvisorInsight {
  id: string;
  meetingId: string;
  type: ParsedAgentResponse['type'];
  priority: ParsedAgentResponse['priority'];
  content: string;
  wasSpoken: boolean;
  timestamp: Date;
}

// Per-meeting agent state
interface AgentState {
  config: AdvisorConfig;
  conversationHistory: ChatMessage[];
  lastInsightTime: number;
  cleanup: () => void;
}

// ============================================
// STATE MANAGEMENT
// ============================================

const agentStates: Map<string, AgentState> = new Map();

const DEFAULT_CONFIG: AdvisorConfig = {
  enabled: true,
  speakEnabled: true,
  speakHighPriorityOnly: true,
  minConfidence: 0.7,
};

// ============================================
// AGENT CONTROL
// ============================================

/**
 * Enable the advisor agent for a meeting
 */
export async function enableAgent(
  meetingId: string,
  config: Partial<AdvisorConfig> = {}
): Promise<void> {
  if (!isConfigured()) {
    throw new Error('OpenAI not configured');
  }

  // Check if already enabled
  if (agentStates.has(meetingId)) {
    console.log(`Advisor agent already enabled for meeting ${meetingId}`);
    return;
  }

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  // Get meeting context
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: {
      attendees: {
        include: { attendee: true },
      },
      agendaItems: {
        orderBy: { order: 'asc' },
      },
    },
  });

  if (!meeting) {
    throw new Error(`Meeting ${meetingId} not found`);
  }

  // Build initial context
  const attendeeNames = meeting.attendees.map(a => a.attendee.name);
  const currentAgenda = meeting.agendaItems.find(a => a.status === 'IN_PROGRESS');

  const initialContext = buildMeetingContext({
    meetingTitle: meeting.title,
    meetingType: meeting.type,
    attendees: attendeeNames,
    currentAgendaItem: currentAgenda?.title,
    recentTranscript: '[Meeting starting...]',
  });

  // Initialize conversation history
  const conversationHistory: ChatMessage[] = [
    { role: 'user', content: initialContext },
  ];

  // Start transcript processing
  const cleanup = startTranscriptProcessing(meetingId, async (transcript) => {
    await processTranscript(meetingId, transcript);
  });

  // Store state
  agentStates.set(meetingId, {
    config: mergedConfig,
    conversationHistory,
    lastInsightTime: 0,
    cleanup,
  });

  console.log(`Advisor agent enabled for meeting ${meetingId}`);
}

/**
 * Disable the advisor agent for a meeting
 */
export function disableAgent(meetingId: string): void {
  const state = agentStates.get(meetingId);
  if (state) {
    state.cleanup();
    agentStates.delete(meetingId);
    console.log(`Advisor agent disabled for meeting ${meetingId}`);
  }
}

/**
 * Update agent configuration
 */
export function updateAgentConfig(
  meetingId: string,
  config: Partial<AdvisorConfig>
): void {
  const state = agentStates.get(meetingId);
  if (state) {
    state.config = { ...state.config, ...config };
  }
}

/**
 * Check if agent is enabled for a meeting
 */
export function isAgentEnabled(meetingId: string): boolean {
  return agentStates.has(meetingId);
}

/**
 * Get agent configuration
 */
export function getAgentConfig(meetingId: string): AdvisorConfig | null {
  return agentStates.get(meetingId)?.config || null;
}

// ============================================
// TRANSCRIPT PROCESSING
// ============================================

/**
 * Process a buffered transcript and generate insights
 */
async function processTranscript(
  meetingId: string,
  transcript: BufferedTranscript
): Promise<void> {
  const state = agentStates.get(meetingId);
  if (!state || !state.config.enabled) {
    return;
  }

  // Rate limit insights (minimum 10 seconds between)
  const now = Date.now();
  if (now - state.lastInsightTime < 10000) {
    return;
  }

  try {
    // Add transcript to conversation
    state.conversationHistory.push({
      role: 'user',
      content: `NEW TRANSCRIPT:\n${transcript.fullText}`,
    });

    // Keep conversation history manageable (last 10 exchanges)
    if (state.conversationHistory.length > 20) {
      state.conversationHistory = state.conversationHistory.slice(-20);
    }

    // Get advisor response
    const response = await createCompletion(state.conversationHistory, {
      systemPrompt: ADVISOR_SYSTEM_PROMPT,
      temperature: 0.7,
    });

    // Parse response
    const parsed = parseAgentResponse(response);

    // Skip if no input
    if (parsed.type === 'none') {
      return;
    }

    // Add response to history
    state.conversationHistory.push({
      role: 'assistant',
      content: response,
    });

    state.lastInsightTime = now;

    // Store insight
    const insight = await storeInsight(meetingId, parsed);

    // Handle speaking
    if (state.config.speakEnabled && parsed.shouldSpeak) {
      if (state.config.speakHighPriorityOnly && parsed.priority !== 'high') {
        // Queue for chat only
        emitInsight(meetingId, insight);
      } else {
        // Speak and emit
        const result = await speak({
          meetingId,
          text: parsed.content,
          alsoChatMessage: true,
        });
        insight.wasSpoken = result.spoken;
        emitInsight(meetingId, insight);
      }
    } else {
      // Just emit to frontend
      emitInsight(meetingId, insight);
    }

    console.log(`Advisor insight for ${meetingId}: [${parsed.type}] ${parsed.content.substring(0, 50)}...`);
  } catch (error: any) {
    console.error('Error processing transcript:', error.message);
  }
}

// ============================================
// INSIGHT STORAGE
// ============================================

/**
 * Store an insight in the database
 */
async function storeInsight(
  meetingId: string,
  parsed: ParsedAgentResponse
): Promise<AdvisorInsight> {
  const insight = await prisma.agentInsight.create({
    data: {
      meetingId,
      type: parsed.type,
      priority: parsed.priority,
      content: parsed.content,
      wasSpoken: false,
      confidence: parsed.priority === 'high' ? 0.9 : 0.7,
    },
  });

  return {
    id: insight.id,
    meetingId: insight.meetingId,
    type: parsed.type,
    priority: parsed.priority,
    content: parsed.content,
    wasSpoken: false,
    timestamp: insight.timestamp,
  };
}

/**
 * Get insights for a meeting
 */
export async function getInsights(
  meetingId: string,
  limit: number = 50
): Promise<AdvisorInsight[]> {
  const insights = await prisma.agentInsight.findMany({
    where: { meetingId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  });

  return insights.map(i => ({
    id: i.id,
    meetingId: i.meetingId,
    type: i.type as ParsedAgentResponse['type'],
    priority: i.priority as ParsedAgentResponse['priority'],
    content: i.content,
    wasSpoken: i.wasSpoken,
    timestamp: i.timestamp,
  }));
}

// ============================================
// EVENT EMITTER
// ============================================

type InsightHandler = (insight: AdvisorInsight) => void;
const insightHandlers: Map<string, InsightHandler[]> = new Map();

/**
 * Register a handler for insights
 */
export function onInsight(
  meetingId: string,
  handler: InsightHandler
): () => void {
  if (!insightHandlers.has(meetingId)) {
    insightHandlers.set(meetingId, []);
  }
  insightHandlers.get(meetingId)!.push(handler);

  return () => {
    const handlers = insightHandlers.get(meetingId);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  };
}

/**
 * Emit an insight to handlers
 */
function emitInsight(meetingId: string, insight: AdvisorInsight): void {
  const handlers = insightHandlers.get(meetingId) || [];
  for (const handler of handlers) {
    try {
      handler(insight);
    } catch (error) {
      console.error('Error in insight handler:', error);
    }
  }
}

// ============================================
// MANUAL INTERACTION
// ============================================

/**
 * Ask the advisor a direct question
 */
export async function askAdvisor(
  meetingId: string,
  question: string
): Promise<string> {
  if (!isConfigured()) {
    throw new Error('OpenAI not configured');
  }

  const lowerQuestion = question.toLowerCase();
  
  // Check if this is a meeting-related question that needs transcript context
  const needsTranscriptContext = 
    lowerQuestion.includes('meeting') ||
    lowerQuestion.includes('discuss') ||
    lowerQuestion.includes('said') ||
    lowerQuestion.includes('mention') ||
    lowerQuestion.includes('talk about') ||
    lowerQuestion.includes('agenda') ||
    lowerQuestion.includes('decision') ||
    lowerQuestion.includes('action') ||
    lowerQuestion.includes('summarize') ||
    lowerQuestion.includes('summary') ||
    lowerQuestion.includes('who said') ||
    lowerQuestion.includes('what did');

  let messageContent: string;

  if (needsTranscriptContext) {
    // Get recent transcript for context
    const recentEntries = await prisma.transcriptEntry.findMany({
      where: { meetingId },
      orderBy: { timestamp: 'desc' },
      take: 20,
    });

    const transcriptContext = recentEntries
      .reverse()
      .map(e => `[${e.speakerName}]: ${e.content}`)
      .join('\n');

    messageContent = transcriptContext 
      ? `Here's what was recently discussed:\n${transcriptContext}\n\nQuestion: ${question}`
      : question;
  } else {
    // General question - just answer directly
    messageContent = question;
  }

  const systemPrompt = `You are Board Observer AI, a friendly voice assistant in a meeting. 
Answer questions directly and briefly (1-2 sentences). 
Be conversational - you're speaking out loud, not writing.
If you don't know something, just say so simply.
Don't overthink or over-explain.`;

  const messages: ChatMessage[] = [
    {
      role: 'user',
      content: messageContent,
    },
  ];

  const response = await createCompletion(messages, {
    systemPrompt,
    temperature: 0.7,
    maxTokens: 150,
  });

  return response;
}

/**
 * Force the advisor to speak
 */
export async function forceSpeak(
  meetingId: string,
  text: string
): Promise<boolean> {
  const result = await speak({
    meetingId,
    text,
    force: true,
    alsoChatMessage: true,
  });

  return result.success;
}

// Export service
export const advisorAgent = {
  enableAgent,
  disableAgent,
  updateAgentConfig,
  isAgentEnabled,
  getAgentConfig,
  getInsights,
  onInsight,
  askAdvisor,
  forceSpeak,
};

export default advisorAgent;
