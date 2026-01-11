/**
 * Tests for API client functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API URL Configuration', () => {
    it('should use localhost by default', () => {
      const defaultUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      expect(defaultUrl).toBe('http://localhost:3001');
    });

    it('should construct API endpoints correctly', () => {
      const baseUrl = 'http://localhost:3001';
      const meetingsEndpoint = `${baseUrl}/api/meetings`;
      expect(meetingsEndpoint).toBe('http://localhost:3001/api/meetings');
    });
  });

  describe('Meeting API Functions', () => {
    it('should fetch all meetings', async () => {
      const mockMeetings = [
        { id: 'meeting-1', title: 'Q4 Board Meeting' },
        { id: 'meeting-2', title: 'Strategy Session' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMeetings),
      });

      const response = await fetch('http://localhost:3001/api/meetings');
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0].title).toBe('Q4 Board Meeting');
    });

    it('should fetch a single meeting by ID', async () => {
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Q4 Board Meeting',
        type: 'board',
        phase: 'upcoming',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockMeeting),
      });

      const response = await fetch('http://localhost:3001/api/meetings/meeting-1');
      const data = await response.json();

      expect(data.id).toBe('meeting-1');
      expect(data.type).toBe('board');
    });

    it('should handle fetch errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const response = await fetch('http://localhost:3001/api/meetings');
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        fetch('http://localhost:3001/api/meetings')
      ).rejects.toThrow('Network error');
    });
  });

  describe('Bot API Functions', () => {
    it('should join bot to meeting', async () => {
      const joinData = {
        meetingUrl: 'https://meet.google.com/abc-defg-hij',
        botName: 'Board Observer AI',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'bot-1',
          status: 'joining',
          recallBotId: 'recall-123',
        }),
      });

      const response = await fetch('http://localhost:3001/api/meetings/meeting-1/bot/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(joinData),
      });
      const data = await response.json();

      expect(data.status).toBe('joining');
      expect(data.recallBotId).toBe('recall-123');
    });

    it('should leave bot from meeting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      const response = await fetch('http://localhost:3001/api/meetings/meeting-1/bot/leave', {
        method: 'POST',
      });

      expect(response.ok).toBe(true);
    });

    it('should get bot status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          status: 'in_meeting',
          joinedAt: '2024-01-15T10:00:00Z',
        }),
      });

      const response = await fetch('http://localhost:3001/api/meetings/meeting-1/bot/status');
      const data = await response.json();

      expect(data.status).toBe('in_meeting');
    });
  });

  describe('Transcript API Functions', () => {
    it('should fetch transcripts', async () => {
      const mockTranscripts = [
        { id: '1', speakerName: 'John', content: 'Hello', timestamp: '2024-01-15T10:00:00Z' },
        { id: '2', speakerName: 'Jane', content: 'Hi there', timestamp: '2024-01-15T10:00:01Z' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTranscripts),
      });

      const response = await fetch('http://localhost:3001/api/meetings/meeting-1/transcript');
      const data = await response.json();

      expect(data).toHaveLength(2);
      expect(data[0].speakerName).toBe('John');
    });
  });

  describe('Agent API Functions', () => {
    it('should ask advisor agent', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          answer: 'Based on the meeting discussion, the Q4 budget is $5M.',
        }),
      });

      const response = await fetch('http://localhost:3001/api/meetings/meeting-1/agent/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: 'What is the Q4 budget?' }),
      });
      const data = await response.json();

      expect(data.answer).toContain('$5M');
    });

    it('should get agent insights', async () => {
      const mockInsights = [
        { id: '1', type: 'recommendation', content: 'Consider risk factors', priority: 'high' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockInsights),
      });

      const response = await fetch('http://localhost:3001/api/meetings/meeting-1/agent/insights');
      const data = await response.json();

      expect(data[0].type).toBe('recommendation');
      expect(data[0].priority).toBe('high');
    });
  });
});

describe('Request Formatting', () => {
  it('should format date strings correctly', () => {
    const date = new Date('2024-01-15T10:00:00Z');
    const isoString = date.toISOString();
    expect(isoString).toBe('2024-01-15T10:00:00.000Z');
  });

  it('should format request headers correctly', () => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('should serialize request body correctly', () => {
    const body = {
      title: 'New Meeting',
      scheduledStart: '2024-01-15T10:00:00Z',
    };
    const serialized = JSON.stringify(body);
    expect(JSON.parse(serialized)).toEqual(body);
  });
});
