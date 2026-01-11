/**
 * Agent Routes
 * 
 * API endpoints for controlling the AI Advisor agent and Recall.ai bot
 */

import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { 
  joinMeeting, 
  leaveMeeting, 
  getBotStatus, 
  sendBotMessage,
  getRecordingInfo,
  fetchAndStoreRecording,
} from '../services/recall/bot';
import { speak, sendMessage } from '../services/recall/audio-output';
import {
  enableAgent,
  disableAgent,
  updateAgentConfig,
  isAgentEnabled,
  getAgentConfig,
  getInsights,
  askAdvisor,
  forceSpeak,
  AdvisorConfig,
} from '../services/openai/advisor-agent';
import {
  muteBot,
  unmuteBot,
  isMuted,
  toggleMute,
} from '../services/ai/wake-word';

const router = Router();

// ============================================
// BOT MANAGEMENT
// ============================================

/**
 * POST /api/meetings/:id/bot/join
 * Send Recall.ai bot to join the meeting
 */
router.post('/meetings/:id/bot/join', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const { meetingUrl, botName } = req.body;

    if (!meetingUrl) {
      return res.status(400).json({ error: 'meetingUrl is required' });
    }

    // Build webhook URL
    const baseUrl = process.env.WEBHOOK_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const webhookUrl = `${baseUrl}/webhooks/recall`;

    const botStatus = await joinMeeting({
      meetingId,
      meetingUrl,
      botName,
      webhookUrl,
      enableTranscription: true,
      enableChat: true,
    });

    res.status(200).json(botStatus);
  } catch (error: any) {
    console.error('Failed to join meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/meetings/:id/bot/leave
 * Remove bot from the meeting
 */
router.post('/meetings/:id/bot/leave', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;

    await leaveMeeting(meetingId);

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Failed to leave meeting:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/meetings/:id/bot/status
 * Get current bot status
 */
router.get('/meetings/:id/bot/status', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;

    const status = await getBotStatus(meetingId);

    if (!status) {
      return res.status(404).json({ error: 'No bot found for this meeting' });
    }

    res.status(200).json(status);
  } catch (error: any) {
    console.error('Failed to get bot status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/meetings/:id/bot/recording
 * Get meeting recording info (URL, transcript, duration)
 */
router.get('/meetings/:id/bot/recording', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;

    const recordingInfo = await getRecordingInfo(meetingId);
    res.status(200).json(recordingInfo);
  } catch (error: any) {
    console.error('Failed to get recording info:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/meetings/:id/bot/recording/refresh
 * Refresh recording info from Recall.ai
 */
router.post('/meetings/:id/bot/recording/refresh', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;

    const result = await fetchAndStoreRecording(meetingId);
    res.status(200).json({
      ...result,
      status: result.recordingUrl ? 'available' : 'processing',
    });
  } catch (error: any) {
    console.error('Failed to refresh recording:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/meetings/:id/bot/speak
 * Make the bot speak in the meeting
 */
router.post('/meetings/:id/bot/speak', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const { text, voice, speed, force } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const result = await speak({
      meetingId,
      text,
      voice,
      speed,
      force,
      alsoChatMessage: true,
    });

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Failed to speak:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/meetings/:id/bot/message
 * Send a chat message (without speaking)
 */
router.post('/meetings/:id/bot/message', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message is required' });
    }

    const success = await sendMessage(meetingId, message);

    res.status(200).json({ success });
  } catch (error: any) {
    console.error('Failed to send message:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ADVISOR AGENT CONTROL
// ============================================

/**
 * POST /api/meetings/:id/agent/enable
 * Enable the advisor agent for a meeting
 */
router.post('/meetings/:id/agent/enable', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const config: Partial<AdvisorConfig> = req.body;

    await enableAgent(meetingId, config);

    res.status(200).json({ 
      enabled: true,
      config: getAgentConfig(meetingId),
    });
  } catch (error: any) {
    console.error('Failed to enable agent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/meetings/:id/agent/disable
 * Disable the advisor agent for a meeting
 */
router.post('/meetings/:id/agent/disable', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;

    disableAgent(meetingId);

    res.status(200).json({ enabled: false });
  } catch (error: any) {
    console.error('Failed to disable agent:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/meetings/:id/agent/status
 * Get agent status and configuration
 */
router.get('/meetings/:id/agent/status', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;

    const enabled = isAgentEnabled(meetingId);
    const config = getAgentConfig(meetingId);

    res.status(200).json({ enabled, config });
  } catch (error: any) {
    console.error('Failed to get agent status:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/meetings/:id/agent/config
 * Update agent configuration
 */
router.put('/meetings/:id/agent/config', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const config: Partial<AdvisorConfig> = req.body;

    updateAgentConfig(meetingId, config);

    res.status(200).json({ 
      success: true,
      config: getAgentConfig(meetingId),
    });
  } catch (error: any) {
    console.error('Failed to update agent config:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/meetings/:id/agent/insights
 * Get agent insights for a meeting
 */
router.get('/meetings/:id/agent/insights', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const insights = await getInsights(meetingId, limit);

    res.status(200).json(insights);
  } catch (error: any) {
    console.error('Failed to get insights:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/meetings/:id/agent/ask
 * Ask the advisor a direct question
 */
router.post('/meetings/:id/agent/ask', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    const answer = await askAdvisor(meetingId, question);

    res.status(200).json({ answer });
  } catch (error: any) {
    console.error('Failed to ask advisor:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/meetings/:id/agent/speak
 * Force the agent to speak a specific message
 */
router.post('/meetings/:id/agent/speak', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }

    const success = await forceSpeak(meetingId, text);

    res.status(200).json({ success });
  } catch (error: any) {
    console.error('Failed to force speak:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MEETING BOT HISTORY
// ============================================

/**
 * GET /api/meetings/:id/bot
 * Get bot information for a meeting
 */
router.get('/meetings/:id/bot', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;

    const bot = await prisma.meetingBot.findUnique({
      where: { meetingId },
    });

    if (!bot) {
      return res.status(404).json({ error: 'No bot found for this meeting' });
    }

    res.status(200).json(bot);
  } catch (error: any) {
    console.error('Failed to get bot:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// BOT MUTE CONTROL
// ============================================

/**
 * POST /api/meetings/:id/bot/mute
 * Mute the bot (stops responding to wake words)
 */
router.post('/meetings/:id/bot/mute', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    muteBot(meetingId);
    res.status(200).json({ muted: true });
  } catch (error: any) {
    console.error('Failed to mute bot:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/meetings/:id/bot/unmute
 * Unmute the bot (resumes responding to wake words)
 */
router.post('/meetings/:id/bot/unmute', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    unmuteBot(meetingId);
    res.status(200).json({ muted: false });
  } catch (error: any) {
    console.error('Failed to unmute bot:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/meetings/:id/bot/toggle-mute
 * Toggle the bot's mute state
 */
router.post('/meetings/:id/bot/toggle-mute', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const newMuteState = toggleMute(meetingId);
    res.status(200).json({ muted: newMuteState });
  } catch (error: any) {
    console.error('Failed to toggle mute:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/meetings/:id/bot/mute-status
 * Get the bot's current mute status
 */
router.get('/meetings/:id/bot/mute-status', async (req: Request, res: Response) => {
  try {
    const { id: meetingId } = req.params;
    const muted = isMuted(meetingId);
    res.status(200).json({ muted });
  } catch (error: any) {
    console.error('Failed to get mute status:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
