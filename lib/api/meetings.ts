/**
 * Meeting API functions
 */

import { apiGet, apiPost, apiPut, apiDelete } from './client';
import type { Meeting, Attendee, AgendaItem, ActionItem, Decision } from '../types';

// ============================================
// MEETINGS
// ============================================

export interface CreateMeetingData {
  title: string;
  type: 'board' | 'committee' | 'review' | 'strategy' | 'operations';
  scheduledStart: string;
  scheduledEnd: string;
  location?: string;
  isVirtual?: boolean;
}

export interface UpdateMeetingData extends Partial<CreateMeetingData> {
  phase?: 'upcoming' | 'live' | 'completed';
}

export async function getMeetings(params?: {
  phase?: string;
  type?: string;
}): Promise<Meeting[]> {
  const searchParams = new URLSearchParams();
  if (params?.phase) searchParams.set('phase', params.phase);
  if (params?.type) searchParams.set('type', params.type);
  const query = searchParams.toString();
  return apiGet<Meeting[]>(`/api/meetings${query ? `?${query}` : ''}`);
}

export async function getMeeting(id: string): Promise<Meeting> {
  return apiGet<Meeting>(`/api/meetings/${id}`);
}

export async function createMeeting(data: CreateMeetingData): Promise<Meeting> {
  return apiPost<Meeting>('/api/meetings', {
    ...data,
    type: data.type.toUpperCase(),
  });
}

export async function updateMeeting(id: string, data: UpdateMeetingData): Promise<Meeting> {
  const apiData: any = { ...data };
  if (data.type) apiData.type = data.type.toUpperCase();
  if (data.phase) apiData.phase = data.phase.toUpperCase();
  return apiPut<Meeting>(`/api/meetings/${id}`, apiData);
}

export async function deleteMeeting(id: string): Promise<void> {
  return apiDelete(`/api/meetings/${id}`);
}

export async function startMeeting(id: string): Promise<Meeting> {
  return apiPost<Meeting>(`/api/meetings/${id}/start`);
}

export async function endMeeting(id: string): Promise<Meeting> {
  return apiPost<Meeting>(`/api/meetings/${id}/end`);
}

// ============================================
// ATTENDEES
// ============================================

export interface CreateAttendeeData {
  name: string;
  email?: string;
  role: string;
  organization?: string;
}

export async function getAttendees(search?: string): Promise<Attendee[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiGet<Attendee[]>(`/api/attendees${query}`);
}

export async function createAttendee(data: CreateAttendeeData): Promise<Attendee> {
  return apiPost<Attendee>('/api/attendees', data);
}

export async function addAttendeeToMeeting(
  meetingId: string,
  attendeeId: string
): Promise<Attendee> {
  return apiPost<Attendee>(`/api/meetings/${meetingId}/attendees`, { attendeeId });
}

export async function removeAttendeeFromMeeting(
  meetingId: string,
  attendeeId: string
): Promise<void> {
  return apiDelete(`/api/meetings/${meetingId}/attendees/${attendeeId}`);
}

export async function updateAttendeeStatus(
  meetingId: string,
  attendeeId: string,
  data: { isPresent?: boolean; isSpeaking?: boolean }
): Promise<Attendee> {
  return apiPut<Attendee>(`/api/meetings/${meetingId}/attendees/${attendeeId}`, data);
}

// ============================================
// AGENDA
// ============================================

export interface CreateAgendaItemData {
  title: string;
  description?: string;
  duration: number;
  presenter?: string;
  order?: number;
}

export interface UpdateAgendaItemData extends Partial<CreateAgendaItemData> {
  status?: 'pending' | 'in-progress' | 'completed' | 'skipped';
}

export async function getAgendaItems(meetingId: string): Promise<AgendaItem[]> {
  return apiGet<AgendaItem[]>(`/api/meetings/${meetingId}/agenda`);
}

export async function createAgendaItem(
  meetingId: string,
  data: CreateAgendaItemData
): Promise<AgendaItem> {
  return apiPost<AgendaItem>(`/api/meetings/${meetingId}/agenda`, data);
}

export async function updateAgendaItem(
  meetingId: string,
  itemId: string,
  data: UpdateAgendaItemData
): Promise<AgendaItem> {
  const apiData: any = { ...data };
  if (data.status) {
    apiData.status = data.status.toUpperCase().replace('-', '_');
  }
  return apiPut<AgendaItem>(`/api/meetings/${meetingId}/agenda/${itemId}`, apiData);
}

export async function deleteAgendaItem(
  meetingId: string,
  itemId: string
): Promise<void> {
  return apiDelete(`/api/meetings/${meetingId}/agenda/${itemId}`);
}

export async function reorderAgendaItems(
  meetingId: string,
  items: { id: string; order: number }[]
): Promise<AgendaItem[]> {
  return apiPost<AgendaItem[]>(`/api/meetings/${meetingId}/agenda/reorder`, { items });
}

// ============================================
// DOCUMENTS
// ============================================

export interface CreateDocumentData {
  title: string;
  type: 'pdf' | 'doc' | 'spreadsheet' | 'presentation' | 'link';
  url: string;
  agendaItemId?: string;
  summary?: string;
}

export async function getDocuments(meetingId: string): Promise<any[]> {
  return apiGet<any[]>(`/api/meetings/${meetingId}/documents`);
}

export async function createDocument(
  meetingId: string,
  data: CreateDocumentData
): Promise<any> {
  return apiPost(`/api/meetings/${meetingId}/documents`, {
    ...data,
    type: data.type.toUpperCase(),
  });
}

export async function deleteDocument(
  meetingId: string,
  documentId: string
): Promise<void> {
  return apiDelete(`/api/meetings/${meetingId}/documents/${documentId}`);
}

// ============================================
// ACTIONS
// ============================================

export interface CreateActionData {
  description: string;
  assigneeId?: string;
  agendaItemId?: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface UpdateActionData extends Partial<CreateActionData> {
  status?: 'pending' | 'in-progress' | 'completed' | 'overdue';
}

export async function getActionItems(meetingId: string): Promise<ActionItem[]> {
  return apiGet<ActionItem[]>(`/api/meetings/${meetingId}/actions`);
}

export async function createActionItem(
  meetingId: string,
  data: CreateActionData
): Promise<ActionItem> {
  return apiPost<ActionItem>(`/api/meetings/${meetingId}/actions`, {
    ...data,
    priority: data.priority.toUpperCase(),
  });
}

export async function updateActionItem(
  meetingId: string,
  actionId: string,
  data: UpdateActionData
): Promise<ActionItem> {
  const apiData: any = { ...data };
  if (data.priority) apiData.priority = data.priority.toUpperCase();
  if (data.status) apiData.status = data.status.toUpperCase().replace('-', '_');
  return apiPut<ActionItem>(`/api/meetings/${meetingId}/actions/${actionId}`, apiData);
}

export async function deleteActionItem(
  meetingId: string,
  actionId: string
): Promise<void> {
  return apiDelete(`/api/meetings/${meetingId}/actions/${actionId}`);
}

// ============================================
// DECISIONS
// ============================================

export interface CreateDecisionData {
  description: string;
  rationale?: string;
  votedFor?: number;
  votedAgainst?: number;
  abstained?: number;
}

export async function getDecisions(meetingId: string): Promise<Decision[]> {
  return apiGet<Decision[]>(`/api/meetings/${meetingId}/decisions`);
}

export async function createDecision(
  meetingId: string,
  data: CreateDecisionData
): Promise<Decision> {
  return apiPost<Decision>(`/api/meetings/${meetingId}/decisions`, data);
}

export async function updateDecision(
  meetingId: string,
  decisionId: string,
  data: Partial<CreateDecisionData>
): Promise<Decision> {
  return apiPut<Decision>(`/api/meetings/${meetingId}/decisions/${decisionId}`, data);
}

// ============================================
// LIVE MEETING (AI FEATURES)
// ============================================

export async function getTranscript(meetingId: string, limit?: number): Promise<any[]> {
  const query = limit ? `?limit=${limit}` : '';
  return apiGet<any[]>(`/api/meetings/${meetingId}/transcript${query}`);
}

export async function getInsights(meetingId: string): Promise<any[]> {
  return apiGet<any[]>(`/api/meetings/${meetingId}/insights`);
}

export async function dismissInsight(
  meetingId: string,
  insightId: string
): Promise<void> {
  return apiPut(`/api/meetings/${meetingId}/insights/${insightId}/dismiss`, {});
}

export async function getDetectedActions(meetingId: string): Promise<any[]> {
  return apiGet<any[]>(`/api/meetings/${meetingId}/detected-actions`);
}

export async function confirmDetectedAction(
  meetingId: string,
  actionId: string,
  data: { assigneeId?: string; dueDate?: string; priority?: string }
): Promise<any> {
  return apiPut(`/api/meetings/${meetingId}/detected-actions/${actionId}/confirm`, data);
}

export async function dismissDetectedAction(
  meetingId: string,
  actionId: string
): Promise<void> {
  return apiPut(`/api/meetings/${meetingId}/detected-actions/${actionId}/dismiss`, {});
}

export async function getDetectedDecisions(meetingId: string): Promise<any[]> {
  return apiGet<any[]>(`/api/meetings/${meetingId}/detected-decisions`);
}

export async function confirmDetectedDecision(
  meetingId: string,
  decisionId: string,
  data: { rationale?: string; votedFor?: number; votedAgainst?: number; abstained?: number }
): Promise<any> {
  return apiPut(`/api/meetings/${meetingId}/detected-decisions/${decisionId}/confirm`, data);
}

// ============================================
// SUMMARY
// ============================================

export async function getMeetingSummary(meetingId: string): Promise<any> {
  return apiGet(`/api/meetings/${meetingId}/summary`);
}

export async function generateMeetingSummary(meetingId: string): Promise<any> {
  return apiPost(`/api/meetings/${meetingId}/summary/generate`);
}

// ============================================
// BOT MANAGEMENT (Recall.ai Integration)
// ============================================

export interface BotStatus {
  id: string;
  meetingId: string;
  recallBotId: string;
  status: 'created' | 'joining' | 'waiting_room' | 'in_meeting' | 'left' | 'completed' | 'error';
  joinedAt: string | null;
  leftAt: string | null;
  recallStatus?: string;
}

export async function getBotStatus(meetingId: string): Promise<BotStatus | null> {
  try {
    return await apiGet<BotStatus>(`/api/meetings/${meetingId}/bot/status`);
  } catch {
    return null;
  }
}

export async function joinMeetingBot(
  meetingId: string,
  data: { meetingUrl: string; botName?: string }
): Promise<BotStatus> {
  return apiPost<BotStatus>(`/api/meetings/${meetingId}/bot/join`, data);
}

export async function leaveMeetingBot(meetingId: string): Promise<void> {
  return apiPost(`/api/meetings/${meetingId}/bot/leave`);
}

export async function makeBotSpeak(
  meetingId: string,
  data: { text: string; voice?: string; speed?: number; force?: boolean }
): Promise<{ success: boolean; spoken: boolean; chatSent: boolean }> {
  return apiPost(`/api/meetings/${meetingId}/bot/speak`, data);
}

export async function sendBotMessage(
  meetingId: string,
  message: string
): Promise<{ success: boolean }> {
  return apiPost(`/api/meetings/${meetingId}/bot/message`, { message });
}

// ============================================
// ADVISOR AGENT (OpenAI Integration)
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
  type: 'recommendation' | 'question' | 'risk_alert' | 'context';
  priority: 'high' | 'medium' | 'low';
  content: string;
  wasSpoken: boolean;
  timestamp: string;
}

export async function getAgentStatus(meetingId: string): Promise<{
  enabled: boolean;
  config: AdvisorConfig | null;
}> {
  return apiGet(`/api/meetings/${meetingId}/agent/status`);
}

export async function enableAdvisorAgent(
  meetingId: string,
  config?: Partial<AdvisorConfig>
): Promise<{ enabled: boolean; config: AdvisorConfig }> {
  return apiPost(`/api/meetings/${meetingId}/agent/enable`, config || {});
}

export async function disableAdvisorAgent(meetingId: string): Promise<{ enabled: boolean }> {
  return apiPost(`/api/meetings/${meetingId}/agent/disable`);
}

export async function updateAgentConfig(
  meetingId: string,
  config: Partial<AdvisorConfig>
): Promise<{ success: boolean; config: AdvisorConfig }> {
  return apiPut(`/api/meetings/${meetingId}/agent/config`, config);
}

export async function getAdvisorInsights(
  meetingId: string,
  limit?: number
): Promise<AdvisorInsight[]> {
  const query = limit ? `?limit=${limit}` : '';
  return apiGet<AdvisorInsight[]>(`/api/meetings/${meetingId}/agent/insights${query}`);
}

export async function askAdvisorQuestion(
  meetingId: string,
  question: string
): Promise<{ answer: string }> {
  return apiPost(`/api/meetings/${meetingId}/agent/ask`, { question });
}

export async function makeAgentSpeak(
  meetingId: string,
  text: string
): Promise<{ success: boolean }> {
  return apiPost(`/api/meetings/${meetingId}/agent/speak`, { text });
}

// ============================================
// RECORDING
// ============================================

export interface RecordingInfo {
  recordingUrl: string | null;
  transcriptUrl: string | null;
  duration: number;
  status: string;
}

export async function getMeetingRecording(meetingId: string): Promise<RecordingInfo | null> {
  try {
    return await apiGet<RecordingInfo>(`/api/meetings/${meetingId}/bot/recording`);
  } catch {
    return null;
  }
}

export async function refreshMeetingRecording(meetingId: string): Promise<RecordingInfo | null> {
  try {
    return await apiPost<RecordingInfo>(`/api/meetings/${meetingId}/bot/recording/refresh`);
  } catch {
    return null;
  }
}
