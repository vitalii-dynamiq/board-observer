/**
 * WebSocket Client for Real-time Meeting Features
 * 
 * Handles WebSocket connection to the backend for live meeting updates.
 * Uses Socket.io for reliable real-time communication.
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  return socket;
}

export function connectSocket(): void {
  const s = getSocket();
  if (!s.connected) {
    s.connect();
  }
}

export function disconnectSocket(): void {
  if (socket?.connected) {
    socket.disconnect();
  }
}

// Meeting room management
export function joinMeeting(meetingId: string): void {
  const s = getSocket();
  s.emit('join-meeting', meetingId);
}

export function leaveMeeting(meetingId: string): void {
  const s = getSocket();
  s.emit('leave-meeting', meetingId);
}

// Recording controls
export function startRecording(meetingId: string): void {
  const s = getSocket();
  s.emit('start-recording', meetingId);
}

export function stopRecording(meetingId: string): void {
  const s = getSocket();
  s.emit('stop-recording', meetingId);
}

// Action management
export function confirmAction(data: {
  meetingId: string;
  actionId: string;
  assigneeId?: string;
  dueDate?: string;
  priority?: string;
}): void {
  const s = getSocket();
  s.emit('confirm-action', data);
}

// Insight management
export function dismissInsight(meetingId: string, insightId: string): void {
  const s = getSocket();
  s.emit('dismiss-insight', { meetingId, insightId });
}

// Attendee updates
export function updateAttendee(data: {
  meetingId: string;
  attendeeId: string;
  isPresent?: boolean;
  isSpeaking?: boolean;
}): void {
  const s = getSocket();
  s.emit('update-attendee', data);
}

// Agenda progression
export function progressAgenda(data: {
  meetingId: string;
  currentItemId: string;
  status: string;
}): void {
  const s = getSocket();
  s.emit('progress-agenda', data);
}

// Ask the AI advisor a question
export function askAgent(data: {
  meetingId: string;
  question: string;
}): void {
  const s = getSocket();
  s.emit('ask-agent', data);
}

// Event listeners
export type SocketEventCallback<T> = (data: T) => void;

export function onTranscriptUpdate(callback: SocketEventCallback<any>): () => void {
  const s = getSocket();
  s.on('transcript-update', callback);
  return () => s.off('transcript-update', callback);
}

export function onInsightGenerated(callback: SocketEventCallback<any>): () => void {
  const s = getSocket();
  s.on('insight-generated', callback);
  return () => s.off('insight-generated', callback);
}

export function onActionDetected(callback: SocketEventCallback<any>): () => void {
  const s = getSocket();
  s.on('action-detected', callback);
  return () => s.off('action-detected', callback);
}

export function onDecisionDetected(callback: SocketEventCallback<any>): () => void {
  const s = getSocket();
  s.on('decision-detected', callback);
  return () => s.off('decision-detected', callback);
}

export function onAgentStatusChange(callback: SocketEventCallback<any[]>): () => void {
  const s = getSocket();
  s.on('agent-status-change', callback);
  return () => s.off('agent-status-change', callback);
}

export function onAgentsActive(callback: SocketEventCallback<any[]>): () => void {
  const s = getSocket();
  s.on('agents-active', callback);
  return () => s.off('agents-active', callback);
}

export function onRecordingStarted(callback: SocketEventCallback<any>): () => void {
  const s = getSocket();
  s.on('recording-started', callback);
  return () => s.off('recording-started', callback);
}

export function onRecordingStopped(callback: SocketEventCallback<any>): () => void {
  const s = getSocket();
  s.on('recording-stopped', callback);
  return () => s.off('recording-stopped', callback);
}

export function onAttendeeUpdated(callback: SocketEventCallback<any>): () => void {
  const s = getSocket();
  s.on('attendee-updated', callback);
  return () => s.off('attendee-updated', callback);
}

export function onAgendaUpdated(callback: SocketEventCallback<any>): () => void {
  const s = getSocket();
  s.on('agenda-updated', callback);
  return () => s.off('agenda-updated', callback);
}

export function onActionConfirmed(callback: SocketEventCallback<any>): () => void {
  const s = getSocket();
  s.on('action-confirmed', callback);
  return () => s.off('action-confirmed', callback);
}

export function onInsightDismissed(callback: SocketEventCallback<{ insightId: string }>): () => void {
  const s = getSocket();
  s.on('insight-dismissed', callback);
  return () => s.off('insight-dismissed', callback);
}

// ============================================
// NEW: Recall.ai + OpenAI Integration Events
// ============================================

// Live transcript (partial, real-time)
export function onTranscriptLive(callback: SocketEventCallback<{
  speaker: string;
  text: string;
  isFinal: boolean;
}>): () => void {
  const s = getSocket();
  s.on('transcript-live', callback);
  return () => s.off('transcript-live', callback);
}

// Advisor insight (from OpenAI)
export function onAdvisorInsight(callback: SocketEventCallback<{
  id: string;
  type: 'recommendation' | 'question' | 'risk_alert' | 'context';
  priority: 'high' | 'medium' | 'low';
  content: string;
  wasSpoken: boolean;
  timestamp: string;
}>): () => void {
  const s = getSocket();
  s.on('advisor-insight', callback);
  return () => s.off('advisor-insight', callback);
}

// Advisor is speaking in meeting
export function onAdvisorSpeaking(callback: SocketEventCallback<{
  content: string;
}>): () => void {
  const s = getSocket();
  s.on('advisor-speaking', callback);
  return () => s.off('advisor-speaking', callback);
}

// Bot status change (Recall.ai)
export function onBotStatusChange(callback: SocketEventCallback<{
  status: string;
  message?: string;
}>): () => void {
  const s = getSocket();
  s.on('bot-status-change', callback);
  return () => s.off('bot-status-change', callback);
}

// Recording done (video available)
export function onRecordingDone(callback: SocketEventCallback<{
  videoUrl: string | null;
  duration: number;
}>): () => void {
  const s = getSocket();
  s.on('recording-done', callback);
  return () => s.off('recording-done', callback);
}

// Agent response (answer to direct question)
export function onAgentResponse(callback: SocketEventCallback<{
  answer?: string;
  error?: string;
}>): () => void {
  const s = getSocket();
  s.on('agent-response', callback);
  return () => s.off('agent-response', callback);
}
