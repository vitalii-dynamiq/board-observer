/**
 * WebSocket Server for Real-time Meeting Features
 * 
 * Powered by Recall.ai for transcription and OpenAI for AI insights.
 * 
 * Events:
 * Client -> Server:
 *   - join-meeting: Join a meeting room
 *   - leave-meeting: Leave a meeting room
 *   - start-recording: Start meeting recording (join Recall.ai bot)
 *   - stop-recording: Stop recording (leave Recall.ai bot)
 *   - confirm-action: Confirm a detected action
 *   - dismiss-insight: Dismiss an insight
 *   - ask-agent: Ask the advisor agent a question
 * 
 * Server -> Client:
 *   - transcript-update: New transcript entry (from Recall.ai)
 *   - transcript-live: Partial live transcript
 *   - advisor-insight: New advisor insight (from OpenAI)
 *   - advisor-speaking: Agent is speaking in meeting
 *   - action-detected: New action detected
 *   - decision-detected: New decision detected
 *   - agent-status-change: Agent status update
 *   - bot-status-change: Recall.ai bot status update
 *   - attendee-joined: Attendee joined meeting
 *   - attendee-left: Attendee left meeting
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import prisma from '../lib/prisma';

// Import AI services - check if AI is mocked or real
const AI_MOCK_ENABLED = process.env.AI_MOCK_ENABLED !== 'false';

// Mock AI services (fallback)
import { getAgentsStatus, resetAgentMetrics } from '../services/ai/agents';
import { startMockTranscription, stopMockTranscription } from '../services/ai/transcript';
import { startMockInsightGeneration, stopMockInsightGeneration } from '../services/ai/insights';
import { startMockDetection, stopMockDetection } from '../services/ai/detection';

// Real AI services (Recall.ai + OpenAI)
import { onWebhookEvent } from '../services/recall/webhooks';
import { onInsight, enableAgent, disableAgent, askAdvisor } from '../services/openai/advisor-agent';

// Track active meeting simulations (mock mode)
const activeMeetingSims: Map<string, {
  transcriptionInterval: NodeJS.Timeout;
  insightInterval: NodeJS.Timeout;
  detectionInterval: NodeJS.Timeout;
}> = new Map();

// Track real AI subscriptions
const realAISubscriptions: Map<string, {
  transcriptUnsub: () => void;
  insightUnsub: () => void;
}> = new Map();

// Store io reference globally for webhook handlers
let globalIO: SocketIOServer | null = null;

export function setupWebSocket(io: SocketIOServer): void {
  globalIO = io;

  // Setup webhook event handlers for real-time updates
  setupRecallWebhookHandlers(io);

  io.on('connection', (socket: Socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join meeting room
    socket.on('join-meeting', async (meetingId: string) => {
      try {
        const meeting = await prisma.meeting.findUnique({
          where: { id: meetingId },
          include: {
            bot: true,
          },
        });

        if (!meeting) {
          socket.emit('error', { message: 'Meeting not found' });
          return;
        }

        socket.join(`meeting:${meetingId}`);
        console.log(`Socket ${socket.id} joined meeting ${meetingId}`);

        // Send current agent status
        if (AI_MOCK_ENABLED) {
          socket.emit('agent-status-change', getAgentsStatus());
        } else {
          // Send real bot status if exists
          if (meeting.bot) {
            socket.emit('bot-status-change', {
              status: meeting.bot.status,
              recallBotId: meeting.bot.recallBotId,
            });
          }
        }

        // If meeting is live and recording, start AI processing
        if (meeting.phase === 'LIVE' && meeting.isRecording) {
          if (AI_MOCK_ENABLED) {
            if (!activeMeetingSims.has(meetingId)) {
              startMeetingSimulation(meetingId, io);
            }
          }
          // Real mode: AI is already processing via webhooks
        }
      } catch (error) {
        console.error('Error joining meeting:', error);
        socket.emit('error', { message: 'Failed to join meeting' });
      }
    });

    // Leave meeting room
    socket.on('leave-meeting', (meetingId: string) => {
      socket.leave(`meeting:${meetingId}`);
      console.log(`Socket ${socket.id} left meeting ${meetingId}`);

      // Check if room is empty, stop simulation if so
      const room = io.sockets.adapter.rooms.get(`meeting:${meetingId}`);
      if (!room || room.size === 0) {
        if (AI_MOCK_ENABLED) {
          stopMeetingSimulation(meetingId);
        }
      }
    });

    // Start recording
    socket.on('start-recording', async (meetingId: string) => {
      try {
        await prisma.meeting.update({
          where: { id: meetingId },
          data: { isRecording: true },
        });

        io.to(`meeting:${meetingId}`).emit('recording-started', { meetingId });

        if (AI_MOCK_ENABLED) {
          // Start mock simulations
          if (!activeMeetingSims.has(meetingId)) {
            startMeetingSimulation(meetingId, io);
          }
        } else {
          // In real mode, the bot should be joined separately via API
          // Enable advisor agent for the meeting
          try {
            await enableAgent(meetingId);
            setupRealAISubscriptions(meetingId, io);
          } catch (err) {
            console.warn('Failed to enable advisor agent:', err);
          }
        }
      } catch (error) {
        console.error('Error starting recording:', error);
        socket.emit('error', { message: 'Failed to start recording' });
      }
    });

    // Stop recording
    socket.on('stop-recording', async (meetingId: string) => {
      try {
        await prisma.meeting.update({
          where: { id: meetingId },
          data: { isRecording: false },
        });

        io.to(`meeting:${meetingId}`).emit('recording-stopped', { meetingId });

        if (AI_MOCK_ENABLED) {
          stopMeetingSimulation(meetingId);
        } else {
          // Disable advisor agent
          disableAgent(meetingId);
          cleanupRealAISubscriptions(meetingId);
        }
      } catch (error) {
        console.error('Error stopping recording:', error);
        socket.emit('error', { message: 'Failed to stop recording' });
      }
    });

    // Ask agent (real-time question to advisor)
    socket.on('ask-agent', async (data: { meetingId: string; question: string }) => {
      try {
        const { meetingId, question } = data;
        
        if (AI_MOCK_ENABLED) {
          // Mock response
          socket.emit('agent-response', {
            answer: 'This is a mocked response. Enable real AI integration by setting AI_MOCK_ENABLED=false.',
          });
        } else {
          const answer = await askAdvisor(meetingId, question);
          socket.emit('agent-response', { answer });
        }
      } catch (error: any) {
        console.error('Error asking agent:', error);
        socket.emit('agent-response', { error: error.message });
      }
    });

    // Confirm detected action
    socket.on('confirm-action', async (data: { 
      meetingId: string; 
      actionId: string; 
      assigneeId?: string;
      dueDate?: string;
      priority?: string;
    }) => {
      try {
        const { meetingId, actionId, assigneeId, dueDate, priority = 'MEDIUM' } = data;

        const detected = await prisma.detectedAction.update({
          where: { id: actionId },
          data: { status: 'CONFIRMED' },
        });

        const action = await prisma.actionItem.create({
          data: {
            meetingId,
            description: detected.description,
            assigneeId,
            dueDate: dueDate ? new Date(dueDate) : undefined,
            priority: priority as any,
          },
          include: {
            assignee: true,
          },
        });

        io.to(`meeting:${meetingId}`).emit('action-confirmed', {
          detected: { ...detected, status: 'confirmed' },
          actionItem: {
            ...action,
            priority: action.priority.toLowerCase(),
            status: action.status.toLowerCase().replace('_', '-'),
            assignee: action.assignee?.name,
          },
        });
      } catch (error) {
        console.error('Error confirming action:', error);
        socket.emit('error', { message: 'Failed to confirm action' });
      }
    });

    // Dismiss insight
    socket.on('dismiss-insight', async (data: { meetingId: string; insightId: string }) => {
      try {
        const { meetingId, insightId } = data;

        // Try dismissing from AgentInsight first (real AI), then LiveInsight (mock)
        try {
          await prisma.agentInsight.update({
            where: { id: insightId },
            data: { dismissed: true },
          });
        } catch {
          await prisma.liveInsight.update({
            where: { id: insightId },
            data: { dismissed: true },
          });
        }

        io.to(`meeting:${meetingId}`).emit('insight-dismissed', { insightId });
      } catch (error) {
        console.error('Error dismissing insight:', error);
        socket.emit('error', { message: 'Failed to dismiss insight' });
      }
    });

    // Update attendee presence
    socket.on('update-attendee', async (data: {
      meetingId: string;
      attendeeId: string;
      isPresent?: boolean;
      isSpeaking?: boolean;
    }) => {
      try {
        const { meetingId, attendeeId, isPresent, isSpeaking } = data;

        const updated = await prisma.meetingAttendee.update({
          where: {
            meetingId_attendeeId: { meetingId, attendeeId },
          },
          data: {
            ...(isPresent !== undefined && { isPresent }),
            ...(isSpeaking !== undefined && { isSpeaking }),
          },
          include: {
            attendee: true,
          },
        });

        io.to(`meeting:${meetingId}`).emit('attendee-updated', {
          id: updated.attendee.id,
          name: updated.attendee.name,
          isPresent: updated.isPresent,
          isSpeaking: updated.isSpeaking,
        });
      } catch (error) {
        console.error('Error updating attendee:', error);
        socket.emit('error', { message: 'Failed to update attendee' });
      }
    });

    // Progress agenda item
    socket.on('progress-agenda', async (data: {
      meetingId: string;
      currentItemId: string;
      status: string;
    }) => {
      try {
        const { meetingId, currentItemId, status } = data;

        await prisma.agendaItem.update({
          where: { id: currentItemId },
          data: { status: status.toUpperCase().replace('-', '_') as any },
        });

        io.to(`meeting:${meetingId}`).emit('agenda-updated', {
          itemId: currentItemId,
          status: status.toLowerCase(),
        });
      } catch (error) {
        console.error('Error progressing agenda:', error);
        socket.emit('error', { message: 'Failed to progress agenda' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });
}

/**
 * Setup Recall.ai webhook event handlers to emit WebSocket events
 */
function setupRecallWebhookHandlers(io: SocketIOServer): void {
  // Handle final transcript updates
  onWebhookEvent('transcript.final', async (data) => {
    io.to(`meeting:${data.meetingId}`).emit('transcript-update', {
      id: data.entryId,
      speaker: data.speaker,
      speakerId: data.speakerId,
      content: data.text,
      timestamp: data.timestamp,
      confidence: data.confidence,
    });
  });

  // Handle partial (live) transcripts
  onWebhookEvent('transcript.partial', async (data) => {
    io.to(`meeting:${data.meetingId}`).emit('transcript-live', {
      speaker: data.speaker,
      text: data.text,
      isFinal: false,
    });
  });

  // Handle bot status changes
  onWebhookEvent('bot.status', async (data) => {
    // Find the meeting for this bot
    const bot = await prisma.meetingBot.findUnique({
      where: { recallBotId: data.botId },
    });

    if (bot) {
      io.to(`meeting:${bot.meetingId}`).emit('bot-status-change', {
        status: data.status,
        message: data.message,
      });
    }
  });

  // Handle recording done
  onWebhookEvent('recording.done', async (data) => {
    io.to(`meeting:${data.meetingId}`).emit('recording-done', {
      videoUrl: data.videoUrl,
      duration: data.duration,
    });
  });
}

/**
 * Setup real AI subscriptions for a meeting
 */
function setupRealAISubscriptions(meetingId: string, io: SocketIOServer): void {
  if (realAISubscriptions.has(meetingId)) {
    return;
  }

  // Subscribe to advisor insights
  const insightUnsub = onInsight(meetingId, (insight) => {
    io.to(`meeting:${meetingId}`).emit('advisor-insight', {
      id: insight.id,
      type: insight.type,
      priority: insight.priority,
      content: insight.content,
      wasSpoken: insight.wasSpoken,
      timestamp: insight.timestamp,
    });

    if (insight.wasSpoken) {
      io.to(`meeting:${meetingId}`).emit('advisor-speaking', {
        content: insight.content,
      });
    }
  });

  realAISubscriptions.set(meetingId, {
    transcriptUnsub: () => {}, // Transcript handled by webhook
    insightUnsub,
  });
}

/**
 * Cleanup real AI subscriptions for a meeting
 */
function cleanupRealAISubscriptions(meetingId: string): void {
  const subs = realAISubscriptions.get(meetingId);
  if (subs) {
    subs.transcriptUnsub();
    subs.insightUnsub();
    realAISubscriptions.delete(meetingId);
  }
}

/**
 * Start mock simulations for a meeting (when AI_MOCK_ENABLED=true)
 */
function startMeetingSimulation(meetingId: string, io: SocketIOServer): void {
  console.log(`Starting mock AI simulation for meeting ${meetingId}`);
  
  resetAgentMetrics();

  const transcriptionInterval = startMockTranscription(meetingId, io, 8000);
  const insightInterval = startMockInsightGeneration(meetingId, io, 15000);
  const detectionInterval = startMockDetection(meetingId, io, 25000);

  activeMeetingSims.set(meetingId, {
    transcriptionInterval,
    insightInterval,
    detectionInterval,
  });

  // Notify clients that AI agents are active
  io.to(`meeting:${meetingId}`).emit('agents-active', getAgentsStatus());
}

/**
 * Stop mock simulations for a meeting
 */
function stopMeetingSimulation(meetingId: string): void {
  const sim = activeMeetingSims.get(meetingId);
  if (sim) {
    console.log(`Stopping mock AI simulation for meeting ${meetingId}`);
    
    stopMockTranscription(sim.transcriptionInterval);
    stopMockInsightGeneration(sim.insightInterval);
    stopMockDetection(sim.detectionInterval);
    
    activeMeetingSims.delete(meetingId);
  }
}

// Export for use in other modules
export function getIO(): SocketIOServer | null {
  return globalIO;
}
