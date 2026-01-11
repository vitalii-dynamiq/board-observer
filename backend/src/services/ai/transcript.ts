/**
 * AI Transcription Service
 * 
 * @AI-INTEGRATION-POINT
 * This module handles real-time transcription of meeting audio.
 * 
 * To integrate with real AI service:
 * 1. Connect audio stream to transcription API
 * 2. Expected endpoint: WebSocket /agents/transcribe
 * 3. Input: Audio stream (WebM/Opus recommended)
 * 4. Output: { speakerId, speakerName, content, confidence, timestamp }
 * 
 * Speaker identification:
 * - First 30 seconds used for voice enrollment
 * - Speaker ID matched against attendee list
 * 
 * Environment variables for real integration:
 * - AI_SERVICE_URL: Base URL of the agentic platform
 * - AI_TRANSCRIBE_MODEL: Model to use (default: whisper-large-v3)
 */

import prisma from '../../lib/prisma';
import { incrementAgentProcessed, updateAgentStatus } from './agents';

// Mock speakers for simulation
const mockSpeakers = [
  { name: 'Margaret Thornton', role: 'Board Chair' },
  { name: 'Robert Castellano', role: 'CEO' },
  { name: 'Victoria Blackwood', role: 'CFO' },
  { name: 'William Okonkwo', role: 'Chief Risk Officer' },
  { name: 'Jennifer Martinez', role: 'CISO' },
];

// Mock transcript phrases for realistic simulation
const mockPhrases = [
  "Based on the Q4 performance data, we're tracking ahead of projections by approximately 2.1%.",
  "I'd like to raise a concern regarding the third-party vendor concentration risk we discussed earlier.",
  "The cybersecurity assessment shows continued improvement in our NIST CSF maturity score.",
  "We should consider forming a subcommittee to oversee the AI governance framework implementation.",
  "The capital allocation for Phase III needs careful consideration given current market conditions.",
  "Our compliance team has reviewed the new EU AI Act requirements and timeline.",
  "I propose we table this item for the Risk Committee's deeper analysis.",
  "The workforce transition plan addresses the key concerns raised in the previous session.",
  "ESG metrics show we're on track for our 2030 net-zero commitment.",
  "I move that we approve the amended capital program as presented.",
  "The internal audit findings support management's assessment of control effectiveness.",
  "We need to ensure appropriate board oversight of emerging technology risks.",
  "The stakeholder feedback has been incorporated into the revised proposal.",
  "I second the motion. All in favor?",
  "Let's proceed to the next agenda item.",
];

/**
 * Generate mock transcript entry
 * 
 * @AI-INTEGRATION-POINT
 * Replace with real transcription from audio stream:
 * 
 * async function transcribeAudio(audioChunk: Buffer, meetingId: string): Promise<TranscriptEntry> {
 *   const response = await fetch(`${process.env.AI_SERVICE_URL}/agents/transcribe`, {
 *     method: 'POST',
 *     body: audioChunk,
 *     headers: { 'X-Meeting-ID': meetingId },
 *   });
 *   return response.json();
 * }
 */
export async function generateMockTranscriptEntry(
  meetingId: string,
  agendaItemId?: string
): Promise<{
  speakerName: string;
  content: string;
  confidence: number;
  highlights: string[];
}> {
  // @AI-INTEGRATION-POINT: This generates MOCKED transcript. Replace with real transcription.
  
  updateAgentStatus('transcriber', 'processing');
  
  // Simulate transcription delay
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const speaker = mockSpeakers[Math.floor(Math.random() * mockSpeakers.length)];
  const phrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];
  const confidence = 0.88 + Math.random() * 0.12; // 0.88 - 1.0
  
  // Extract potential highlights (key terms)
  const highlights: string[] = [];
  if (phrase.includes('approve') || phrase.includes('motion')) {
    highlights.push('Decision Point');
  }
  if (phrase.includes('propose') || phrase.includes('recommend')) {
    highlights.push('Recommendation');
  }
  if (phrase.includes('concern') || phrase.includes('risk')) {
    highlights.push('Risk Discussion');
  }
  if (phrase.includes('%') || phrase.includes('$')) {
    highlights.push('Financial Data');
  }
  
  incrementAgentProcessed('transcriber');
  updateAgentStatus('transcriber', 'listening');
  
  return {
    speakerName: speaker.name,
    content: phrase,
    confidence,
    highlights,
  };
}

/**
 * Start mock transcription simulation
 * Generates periodic transcript entries for a live meeting
 * 
 * @AI-INTEGRATION-POINT
 * In production, this would be replaced by:
 * - Audio capture from meeting platform
 * - WebSocket connection to transcription service
 * - Real-time transcript updates
 */
export function startMockTranscription(
  meetingId: string,
  io: any,
  intervalMs: number = 8000
): NodeJS.Timeout {
  // @AI-INTEGRATION-POINT: This is a MOCK simulation loop
  
  return setInterval(async () => {
    try {
      // Get current agenda item
      const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
          agendaItems: {
            where: { status: 'IN_PROGRESS' },
            take: 1,
          },
        },
      });

      if (!meeting || meeting.phase !== 'LIVE') {
        return;
      }

      const agendaItemId = meeting.agendaItems[0]?.id;
      const mockData = await generateMockTranscriptEntry(meetingId, agendaItemId);

      // Create transcript entry in database
      const entry = await prisma.transcriptEntry.create({
        data: {
          meetingId,
          agendaItemId,
          speakerName: mockData.speakerName,
          content: mockData.content,
          confidence: mockData.confidence,
          highlights: mockData.highlights,
        },
      });

      // Emit via WebSocket
      io.to(`meeting:${meetingId}`).emit('transcript-update', entry);
    } catch (error) {
      console.error('Mock transcription error:', error);
    }
  }, intervalMs);
}

/**
 * Stop mock transcription
 */
export function stopMockTranscription(intervalId: NodeJS.Timeout): void {
  clearInterval(intervalId);
}
