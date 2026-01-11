/**
 * Tests for Recall.ai Bot Service
 * 
 * These tests validate the bot service functionality for joining,
 * leaving, and managing Recall.ai bots in meetings.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock modules with factory functions (hoisted to top)
vi.mock('../../../lib/prisma', () => ({
  default: {
    meeting: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    meetingBot: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
  },
}));

vi.mock('../../../services/recall/client', () => ({
  createBot: vi.fn(),
  getBot: vi.fn(),
  deleteBot: vi.fn(),
  leaveBot: vi.fn(),
  outputAudio: vi.fn(),
  sendChatMessage: vi.fn(),
  getRecording: vi.fn(),
}));

vi.mock('../../../lib/logger', () => ({
  botLogger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import after mocking
import prisma from '../../../lib/prisma';
import * as recallClient from '../../../services/recall/client';
import {
  joinMeeting,
  leaveMeeting,
  getBotStatus,
  sendBotMessage,
  fetchAndStoreRecording,
} from '../../../services/recall/bot';

describe('Bot Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('joinMeeting', () => {
    it('should create a new bot and join meeting', async () => {
      const mockRecallBot = {
        id: 'recall-bot-123',
        status: 'joining_call',
        video_url: null,
      };

      vi.mocked(prisma.meeting.findUnique).mockResolvedValue({
        id: 'meeting-1',
        title: 'Test Meeting',
      } as any);

      vi.mocked(prisma.meetingBot.findUnique).mockResolvedValue(null);
      vi.mocked(recallClient.createBot).mockResolvedValue(mockRecallBot as any);
      vi.mocked(prisma.meetingBot.upsert).mockResolvedValue({
        id: 'bot-1',
        meetingId: 'meeting-1',
        recallBotId: 'recall-bot-123',
        status: 'created',
      } as any);
      vi.mocked(prisma.meeting.update).mockResolvedValue({} as any);

      const result = await joinMeeting({
        meetingId: 'meeting-1',
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        botName: 'Board Observer',
      });

      expect(recallClient.createBot).toHaveBeenCalledWith(
        expect.objectContaining({
          meeting_url: 'https://meet.google.com/abc-defg-hij',
          bot_name: 'Board Observer',
        })
      );
      expect(result.recallBotId).toBe('recall-bot-123');
    });

    it('should throw error if bot already active', async () => {
      vi.mocked(prisma.meeting.findUnique).mockResolvedValue({
        id: 'meeting-1',
        title: 'Test Meeting',
      } as any);

      vi.mocked(prisma.meetingBot.findUnique).mockResolvedValue({
        id: 'bot-1',
        meetingId: 'meeting-1',
        recallBotId: 'existing-bot-123',
        status: 'in_meeting',
      } as any);

      await expect(
        joinMeeting({
          meetingId: 'meeting-1',
          meetingUrl: 'https://meet.google.com/abc-defg-hij',
        })
      ).rejects.toThrow('Bot already active');

      expect(recallClient.createBot).not.toHaveBeenCalled();
    });

    it('should throw error if meeting not found', async () => {
      vi.mocked(prisma.meeting.findUnique).mockResolvedValue(null);

      await expect(
        joinMeeting({
          meetingId: 'non-existent',
          meetingUrl: 'https://meet.google.com/abc',
        })
      ).rejects.toThrow();
    });
  });

  describe('leaveMeeting', () => {
    it('should make bot leave and update status', async () => {
      vi.mocked(prisma.meetingBot.findUnique).mockResolvedValue({
        id: 'bot-1',
        meetingId: 'meeting-1',
        recallBotId: 'recall-bot-123',
        status: 'in_meeting',
      } as any);

      vi.mocked(recallClient.getRecording).mockResolvedValue({
        video_url: 'https://storage.example.com/video.mp4',
        transcript_url: 'https://storage.example.com/transcript.txt',
        duration: 3600,
        status: 'available',
      });

      vi.mocked(recallClient.leaveBot).mockResolvedValue(undefined);
      vi.mocked(prisma.meetingBot.update).mockResolvedValue({} as any);
      vi.mocked(prisma.meeting.update).mockResolvedValue({} as any);

      await leaveMeeting('meeting-1');

      expect(recallClient.leaveBot).toHaveBeenCalledWith('recall-bot-123');
      expect(prisma.meetingBot.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'left',
          }),
        })
      );
    });

    it('should throw error if no bot found', async () => {
      vi.mocked(prisma.meetingBot.findUnique).mockResolvedValue(null);

      await expect(leaveMeeting('meeting-1')).rejects.toThrow();
    });
  });

  describe('getBotStatus', () => {
    it('should return current bot status', async () => {
      vi.mocked(prisma.meetingBot.findUnique).mockResolvedValue({
        id: 'bot-1',
        meetingId: 'meeting-1',
        recallBotId: 'recall-bot-123',
        status: 'in_meeting',
        joinedAt: new Date(),
        leftAt: null,
      } as any);

      vi.mocked(recallClient.getBot).mockResolvedValue({
        id: 'recall-bot-123',
        status: 'in_call_recording',
      } as any);

      const result = await getBotStatus('meeting-1');

      expect(result).toBeTruthy();
      expect(result?.status).toBe('in_meeting');
      expect(result?.recallBotId).toBe('recall-bot-123');
    });

    it('should return null if no bot exists', async () => {
      vi.mocked(prisma.meetingBot.findUnique).mockResolvedValue(null);

      const result = await getBotStatus('meeting-1');

      expect(result).toBeNull();
    });

    it('should update status from Recall.ai', async () => {
      vi.mocked(prisma.meetingBot.findUnique).mockResolvedValue({
        id: 'bot-1',
        meetingId: 'meeting-1',
        recallBotId: 'recall-bot-123',
        status: 'joining',
        joinedAt: null,
        leftAt: null,
      } as any);

      vi.mocked(recallClient.getBot).mockResolvedValue({
        id: 'recall-bot-123',
        status: 'in_call_recording',
      } as any);

      vi.mocked(prisma.meetingBot.update).mockResolvedValue({
        id: 'bot-1',
        meetingId: 'meeting-1',
        recallBotId: 'recall-bot-123',
        status: 'in_meeting',
        joinedAt: new Date(),
        leftAt: null,
      } as any);

      await getBotStatus('meeting-1');

      // Status should be synced from Recall.ai
      expect(prisma.meetingBot.update).toHaveBeenCalled();
    });
  });

  describe('sendBotMessage', () => {
    it('should send chat message via bot', async () => {
      vi.mocked(prisma.meetingBot.findUnique).mockResolvedValue({
        id: 'bot-1',
        meetingId: 'meeting-1',
        recallBotId: 'recall-bot-123',
        status: 'in_meeting',
      } as any);

      vi.mocked(recallClient.sendChatMessage).mockResolvedValue(undefined);

      await sendBotMessage('meeting-1', 'Hello from Board Observer');

      expect(recallClient.sendChatMessage).toHaveBeenCalledWith(
        'recall-bot-123',
        'Hello from Board Observer',
        'everyone'
      );
    });
  });

  describe('fetchAndStoreRecording', () => {
    it('should fetch and store recording URLs', async () => {
      vi.mocked(prisma.meetingBot.findUnique).mockResolvedValue({
        id: 'bot-1',
        meetingId: 'meeting-1',
        recallBotId: 'recall-bot-123',
      } as any);

      vi.mocked(recallClient.getBot).mockResolvedValue({
        id: 'recall-bot-123',
        video_url: 'https://storage.example.com/video.mp4',
        status: 'done',
        recordings: [{
          media_shortcuts: {
            video: { url: 'https://storage.example.com/video.mp4', status: 'media_available' },
            transcript: { url: 'https://storage.example.com/transcript.txt', status: 'media_available' },
          },
          duration: 3600000, // in milliseconds
        }],
      } as any);

      vi.mocked(prisma.meetingBot.update).mockResolvedValue({} as any);
      vi.mocked(prisma.meeting.update).mockResolvedValue({} as any);

      const result = await fetchAndStoreRecording('meeting-1');

      expect(result.recordingUrl).toBeTruthy();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing recording gracefully', async () => {
      vi.mocked(prisma.meetingBot.findUnique).mockResolvedValue({
        id: 'bot-1',
        meetingId: 'meeting-1',
        recallBotId: 'recall-bot-123',
      } as any);

      vi.mocked(recallClient.getBot).mockRejectedValue(new Error('Not found'));

      const result = await fetchAndStoreRecording('meeting-1');

      expect(result.recordingUrl).toBeNull();
      expect(result.transcriptUrl).toBeNull();
    });
  });
});
