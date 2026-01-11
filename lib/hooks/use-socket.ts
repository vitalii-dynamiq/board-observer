/**
 * React hook for WebSocket connection and real-time meeting updates
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  joinMeeting,
  leaveMeeting,
  startRecording as wsStartRecording,
  stopRecording as wsStopRecording,
  confirmAction as wsConfirmAction,
  dismissInsight as wsDismissInsight,
  updateAttendee as wsUpdateAttendee,
  progressAgenda as wsProgressAgenda,
  onTranscriptUpdate,
  onInsightGenerated,
  onActionDetected,
  onDecisionDetected,
  onAgentStatusChange,
  onAgentsActive,
  onRecordingStarted,
  onRecordingStopped,
  onAttendeeUpdated,
  onAgendaUpdated,
  onActionConfirmed,
  onInsightDismissed,
  onAdvisorInsight,
  onBotStatusChange,
  onRecordingDone,
} from '../api/socket';
import { getTranscript, getInsights, getDetectedActions, getDetectedDecisions } from '../api/meetings';
import type { AIAgent } from '../types';

interface LiveMeetingState {
  isConnected: boolean;
  isRecording: boolean;
  agents: AIAgent[];
  transcript: any[];
  insights: any[];
  detectedActions: any[];
  detectedDecisions: any[];
  botStatus: string | null;
  advisorInsights: any[];
  recordingUrl: string | null;
}

export function useLiveMeeting(meetingId: string | null, enabled: boolean = true) {
  const [state, setState] = useState<LiveMeetingState>({
    isConnected: false,
    isRecording: false,
    agents: [],
    transcript: [],
    insights: [],
    detectedActions: [],
    detectedDecisions: [],
    botStatus: null,
    advisorInsights: [],
    recordingUrl: null,
  });

  const cleanupRef = useRef<(() => void)[]>([]);

  // Fetch initial data from API
  useEffect(() => {
    if (!meetingId || !enabled) return;

    const fetchInitialData = async () => {
      try {
        const [transcriptData, insightsData, actionsData, decisionsData] = await Promise.all([
          getTranscript(meetingId, 100).catch(() => []),
          getInsights(meetingId).catch(() => []),
          getDetectedActions(meetingId).catch(() => []),
          getDetectedDecisions(meetingId).catch(() => []),
        ]);

        setState(prev => ({
          ...prev,
          transcript: transcriptData,
          insights: insightsData,
          detectedActions: actionsData,
          detectedDecisions: decisionsData,
        }));
      } catch (error) {
        console.error('Failed to fetch initial live data:', error);
      }
    };

    fetchInitialData();
  }, [meetingId, enabled]);

  useEffect(() => {
    if (!meetingId || !enabled) return;

    // Connect socket
    connectSocket();
    
    const socket = getSocket();
    
    const handleConnect = () => {
      setState(prev => ({ ...prev, isConnected: true }));
      joinMeeting(meetingId);
    };

    const handleDisconnect = () => {
      setState(prev => ({ ...prev, isConnected: false }));
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // If already connected, join meeting
    if (socket.connected) {
      setState(prev => ({ ...prev, isConnected: true }));
      joinMeeting(meetingId);
    }

    // Set up event listeners
    // Append new entries to end (chronological order: oldest first, newest at bottom)
    const unsubTranscript = onTranscriptUpdate((entry) => {
      setState(prev => ({
        ...prev,
        transcript: [...prev.transcript, entry].slice(-100),
      }));
    });

    const unsubInsight = onInsightGenerated((insight) => {
      setState(prev => ({
        ...prev,
        insights: [insight, ...prev.insights],
      }));
    });

    const unsubAction = onActionDetected((action) => {
      setState(prev => ({
        ...prev,
        detectedActions: [action, ...prev.detectedActions],
      }));
    });

    const unsubDecision = onDecisionDetected((decision) => {
      setState(prev => ({
        ...prev,
        detectedDecisions: [decision, ...prev.detectedDecisions],
      }));
    });

    const unsubAgentStatus = onAgentStatusChange((agents) => {
      setState(prev => ({ ...prev, agents }));
    });

    const unsubAgentsActive = onAgentsActive((agents) => {
      setState(prev => ({ ...prev, agents }));
    });

    const unsubRecordingStarted = onRecordingStarted(() => {
      setState(prev => ({ ...prev, isRecording: true }));
    });

    const unsubRecordingStopped = onRecordingStopped(() => {
      setState(prev => ({ ...prev, isRecording: false }));
    });

    const unsubInsightDismissed = onInsightDismissed(({ insightId }) => {
      setState(prev => ({
        ...prev,
        insights: prev.insights.filter(i => i.id !== insightId),
      }));
    });

    const unsubActionConfirmed = onActionConfirmed(({ detected }) => {
      setState(prev => ({
        ...prev,
        detectedActions: prev.detectedActions.map(a => 
          a.id === detected.id ? { ...a, status: 'confirmed' } : a
        ),
      }));
    });

    // New: Advisor insights from OpenAI
    const unsubAdvisorInsight = onAdvisorInsight((insight) => {
      setState(prev => ({
        ...prev,
        advisorInsights: [insight, ...prev.advisorInsights],
        // Also add to general insights for display
        insights: [{ ...insight, type: insight.type }, ...prev.insights],
      }));
    });

    // New: Bot status changes from Recall.ai
    const unsubBotStatus = onBotStatusChange(({ status }) => {
      setState(prev => ({
        ...prev,
        botStatus: status,
        isRecording: status === 'in_meeting' || status === 'recording',
      }));
    });

    // New: Recording completed
    const unsubRecordingDone = onRecordingDone(({ videoUrl }) => {
      setState(prev => ({
        ...prev,
        recordingUrl: videoUrl,
        isRecording: false,
      }));
    });

    cleanupRef.current = [
      unsubTranscript,
      unsubInsight,
      unsubAction,
      unsubDecision,
      unsubAgentStatus,
      unsubAgentsActive,
      unsubRecordingStarted,
      unsubRecordingStopped,
      unsubInsightDismissed,
      unsubActionConfirmed,
      unsubAdvisorInsight,
      unsubBotStatus,
      unsubRecordingDone,
    ];

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      cleanupRef.current.forEach(unsub => unsub());
      leaveMeeting(meetingId);
    };
  }, [meetingId, enabled]);

  const startRecording = useCallback(() => {
    if (meetingId) {
      wsStartRecording(meetingId);
    }
  }, [meetingId]);

  const stopRecording = useCallback(() => {
    if (meetingId) {
      wsStopRecording(meetingId);
    }
  }, [meetingId]);

  const confirmAction = useCallback((
    actionId: string,
    data?: { assigneeId?: string; dueDate?: string; priority?: string }
  ) => {
    if (meetingId) {
      wsConfirmAction({
        meetingId,
        actionId,
        ...data,
      });
    }
  }, [meetingId]);

  const dismissInsight = useCallback((insightId: string) => {
    if (meetingId) {
      wsDismissInsight(meetingId, insightId);
    }
  }, [meetingId]);

  const updateAttendee = useCallback((
    attendeeId: string,
    data: { isPresent?: boolean; isSpeaking?: boolean }
  ) => {
    if (meetingId) {
      wsUpdateAttendee({
        meetingId,
        attendeeId,
        ...data,
      });
    }
  }, [meetingId]);

  const progressAgenda = useCallback((
    currentItemId: string,
    status: string
  ) => {
    if (meetingId) {
      wsProgressAgenda({
        meetingId,
        currentItemId,
        status,
      });
    }
  }, [meetingId]);

  return {
    ...state,
    startRecording,
    stopRecording,
    confirmAction,
    dismissInsight,
    updateAttendee,
    progressAgenda,
  };
}

// Hook just for socket connection status
export function useSocketConnection() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  return { isConnected, connect: connectSocket, disconnect: disconnectSocket };
}
