/**
 * OpenAI Agent Prompts
 * 
 * System prompts for the various AI agents in the Board Observer platform.
 */

// ============================================
// ADVISOR AGENT PROMPT
// ============================================

export const ADVISOR_SYSTEM_PROMPT = `You are Board Observer AI, a friendly and helpful voice assistant in a meeting.

CRITICAL RULES:
1. Answer questions DIRECTLY and BRIEFLY (1-2 sentences max)
2. Be conversational and natural - you're speaking out loud
3. For general questions (weather, time, facts), just answer them helpfully
4. For meeting-related questions, reference the transcript context provided
5. If you don't know something, say so briefly
6. NEVER mention "the transcript" or "the context" in your response
7. Speak as if you're a helpful colleague in the room

EXAMPLES:
- "What's the weather?" → "I don't have access to weather data, but you could check your phone quickly."
- "What time is it?" → "I don't have access to the current time, sorry!"
- "Summarize what we discussed" → [Reference the actual meeting content]
- "What did John say about the budget?" → [Reference the actual meeting content]

Keep responses SHORT - you're speaking out loud, not writing an essay.`;

// ============================================
// CONTEXT BUILDER
// ============================================

/**
 * Build context for the advisor based on meeting information
 */
export function buildMeetingContext(params: {
  meetingTitle: string;
  meetingType: string;
  attendees: string[];
  currentAgendaItem?: string;
  recentTranscript: string;
}): string {
  const { meetingTitle, meetingType, attendees, currentAgendaItem, recentTranscript } = params;

  let context = `MEETING CONTEXT:
- Meeting: ${meetingTitle}
- Type: ${meetingType}
- Attendees: ${attendees.join(', ')}`;

  if (currentAgendaItem) {
    context += `\n- Current Agenda Item: ${currentAgendaItem}`;
  }

  context += `\n\nRECENT DISCUSSION:\n${recentTranscript}`;

  return context;
}

// ============================================
// RESPONSE PARSER
// ============================================

export interface ParsedAgentResponse {
  type: 'recommendation' | 'question' | 'risk_alert' | 'context' | 'none';
  priority: 'high' | 'medium' | 'low';
  content: string;
  shouldSpeak: boolean;
}

/**
 * Parse the agent's response into structured format
 */
export function parseAgentResponse(response: string): ParsedAgentResponse {
  // Check for no input
  if (response.trim() === 'NO_INPUT') {
    return {
      type: 'none',
      priority: 'low',
      content: '',
      shouldSpeak: false,
    };
  }

  // Parse structured response
  const typeMatch = response.match(/\[TYPE:\s*(recommendation|question|risk_alert|context)\]/i);
  const priorityMatch = response.match(/\[PRIORITY:\s*(high|medium|low)\]/i);
  
  const type = (typeMatch?.[1]?.toLowerCase() as ParsedAgentResponse['type']) || 'recommendation';
  const priority = (priorityMatch?.[1]?.toLowerCase() as ParsedAgentResponse['priority']) || 'medium';
  
  // Extract content (everything after the metadata)
  let content = response
    .replace(/\[TYPE:\s*\w+\]/gi, '')
    .replace(/\[PRIORITY:\s*\w+\]/gi, '')
    .trim();

  // Determine if this should be spoken aloud
  const shouldSpeak = priority === 'high' || type === 'risk_alert';

  return {
    type,
    priority,
    content,
    shouldSpeak,
  };
}

// ============================================
// CHAT ASSISTANT PROMPT
// ============================================

export const CHAT_ASSISTANT_PROMPT = `You are a helpful AI assistant for board members during a meeting. You can:

1. Answer questions about what was discussed
2. Summarize specific topics or time periods
3. Clarify points made by participants
4. Provide relevant background information

Keep responses concise and directly relevant to the question. If referencing something from the transcript, quote the relevant speaker.

If asked about something not covered in the meeting, acknowledge this and offer to help with related information you can provide.`;

// ============================================
// SUMMARY PROMPT
// ============================================

export const SUMMARY_PROMPT = `Analyze the following meeting transcript and provide a structured summary.

FORMAT YOUR RESPONSE AS JSON:
{
  "overview": "2-3 sentence executive summary",
  "keyDiscussions": [
    {
      "topic": "Topic name",
      "summary": "Brief summary",
      "outcome": "Decision or next steps if any"
    }
  ],
  "decisions": [
    {
      "description": "What was decided",
      "votesFor": number or null,
      "votesAgainst": number or null
    }
  ],
  "actionItems": [
    {
      "description": "Action to be taken",
      "assignee": "Person responsible or null",
      "deadline": "Mentioned deadline or null"
    }
  ],
  "risks": ["List of risks mentioned or identified"],
  "nextSteps": ["Immediate next steps"]
}`;

export default {
  ADVISOR_SYSTEM_PROMPT,
  CHAT_ASSISTANT_PROMPT,
  SUMMARY_PROMPT,
  buildMeetingContext,
  parseAgentResponse,
};
