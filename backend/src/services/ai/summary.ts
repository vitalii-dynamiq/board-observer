/**
 * AI Meeting Summary Service
 * 
 * @AI-INTEGRATION-POINT
 * This module provides MOCKED AI summary generation.
 * 
 * To integrate with real AI service:
 * 1. Replace the mock generateMeetingSummary function
 * 2. Expected endpoint: POST /agents/summarize
 * 3. Expected request body: { meetingId, transcript, agendaItems, decisions, actions }
 * 4. Expected response: { overview, attendanceNotes, nextSteps, discussions[] }
 * 
 * Environment variables for real integration:
 * - AI_SERVICE_URL: Base URL of the agentic platform
 * - AI_MOCK_ENABLED: Set to 'false' to use real AI
 */

import { Meeting, Attendee, AgendaItem, TranscriptEntry, Decision, ActionItem } from '@prisma/client';

// Interface for expected AI response
export interface SummaryData {
  overview: string;
  attendanceNotes: string;
  nextSteps: string[];
  discussions: {
    agendaItemId: string;
    title: string;
    summary: string;
    keyPoints: string[];
    outcome: string;
    duration: number;
  }[];
}

// Type for meeting with relations
type MeetingWithRelations = Meeting & {
  attendees: { attendee: Attendee; isPresent: boolean }[];
  agendaItems: AgendaItem[];
  transcriptEntries: TranscriptEntry[];
  decisions: Decision[];
  actionItems: (ActionItem & { assignee: Attendee | null })[];
};

/**
 * Generate meeting summary
 * 
 * @AI-INTEGRATION-POINT
 * Replace this function with real AI service call:
 * 
 * async function generateMeetingSummary(meeting: MeetingWithRelations): Promise<SummaryData> {
 *   const response = await fetch(`${process.env.AI_SERVICE_URL}/agents/summarize`, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *       meetingId: meeting.id,
 *       transcript: meeting.transcriptEntries,
 *       agendaItems: meeting.agendaItems,
 *       decisions: meeting.decisions,
 *       actions: meeting.actionItems,
 *     }),
 *   });
 *   return response.json();
 * }
 */
export async function generateMeetingSummary(meeting: MeetingWithRelations): Promise<SummaryData> {
  // @AI-INTEGRATION-POINT: This is MOCKED data. Replace with real AI call.
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const presentAttendees = meeting.attendees.filter(a => a.isPresent);
  const absentAttendees = meeting.attendees.filter(a => !a.isPresent);

  // Generate mock summary based on actual meeting data
  const overview = `The ${meeting.title} convened on ${new Date(meeting.scheduledStart).toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}. The meeting addressed ${meeting.agendaItems.length} agenda items with ${presentAttendees.length} participants present. ${
    meeting.decisions.length > 0 
      ? `A total of ${meeting.decisions.length} decision(s) were recorded.` 
      : 'Key discussions focused on strategic priorities and operational updates.'
  } ${
    meeting.actionItems.length > 0 
      ? `${meeting.actionItems.length} action item(s) were assigned for follow-up.` 
      : ''
  }`;

  const attendanceNotes = `${presentAttendees.length} of ${meeting.attendees.length} invited members were present${
    absentAttendees.length > 0 
      ? `. Absent: ${absentAttendees.map(a => a.attendee.name).join(', ')}.` 
      : '.'
  }`;

  const nextSteps = [
    ...meeting.actionItems
      .filter(a => a.status !== 'COMPLETED')
      .slice(0, 3)
      .map(a => `${a.description}${a.assignee ? ` (Assigned to ${a.assignee.name})` : ''}`),
    'Circulate meeting minutes to all board members within 48 hours',
    'Schedule follow-up discussions for outstanding items',
  ];

  const discussions = meeting.agendaItems
    .filter(item => item.status === 'COMPLETED' || item.status === 'IN_PROGRESS')
    .map(item => {
      const analysis = item.aiAnalysis as any;
      return {
        agendaItemId: item.id,
        title: item.title,
        summary: analysis?.summary || `Discussion on ${item.title} covered key aspects and considerations.`,
        keyPoints: analysis?.keyPoints?.slice(0, 4) || [
          `Reviewed current status and progress`,
          `Identified key risks and mitigation strategies`,
          `Discussed resource requirements and timeline`,
        ],
        outcome: analysis?.outcome || 'Discussion concluded with consensus on next steps.',
        duration: item.duration,
      };
    });

  return {
    overview,
    attendanceNotes,
    nextSteps,
    discussions,
  };
}
