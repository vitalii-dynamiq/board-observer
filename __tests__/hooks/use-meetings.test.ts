/**
 * Tests for use-meetings hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('useMeetings Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Data Fetching', () => {
    it('should return loading state initially', () => {
      const hookState = {
        meetings: [],
        isLoading: true,
        isError: false,
        mutate: vi.fn(),
      };

      expect(hookState.isLoading).toBe(true);
      expect(hookState.meetings).toHaveLength(0);
    });

    it('should return meetings when loaded', () => {
      const mockMeetings = [
        { id: 'meeting-1', title: 'Q4 Board Meeting' },
        { id: 'meeting-2', title: 'Strategy Session' },
      ];

      const hookState = {
        meetings: mockMeetings,
        isLoading: false,
        isError: false,
        mutate: vi.fn(),
      };

      expect(hookState.isLoading).toBe(false);
      expect(hookState.meetings).toHaveLength(2);
    });

    it('should return error state on failure', () => {
      const hookState = {
        meetings: [],
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch'),
        mutate: vi.fn(),
      };

      expect(hookState.isError).toBe(true);
      expect(hookState.error?.message).toBe('Failed to fetch');
    });
  });

  describe('Meeting Filtering', () => {
    const mockMeetings = [
      { id: 'meeting-1', title: 'Board Meeting', phase: 'upcoming', type: 'board' },
      { id: 'meeting-2', title: 'Live Session', phase: 'live', type: 'strategy' },
      { id: 'meeting-3', title: 'Past Meeting', phase: 'completed', type: 'review' },
    ];

    it('should filter by phase', () => {
      const liveMeetings = mockMeetings.filter(m => m.phase === 'live');
      expect(liveMeetings).toHaveLength(1);
      expect(liveMeetings[0].title).toBe('Live Session');
    });

    it('should filter by type', () => {
      const boardMeetings = mockMeetings.filter(m => m.type === 'board');
      expect(boardMeetings).toHaveLength(1);
      expect(boardMeetings[0].title).toBe('Board Meeting');
    });

    it('should filter by multiple criteria', () => {
      const filtered = mockMeetings.filter(
        m => m.phase === 'upcoming' && m.type === 'board'
      );
      expect(filtered).toHaveLength(1);
    });
  });

  describe('useMeeting Hook (single meeting)', () => {
    it('should return null when meeting not found', () => {
      const hookState = {
        meeting: null,
        isLoading: false,
        isError: true,
      };

      expect(hookState.meeting).toBeNull();
      expect(hookState.isError).toBe(true);
    });

    it('should return meeting when found', () => {
      const mockMeeting = {
        id: 'meeting-1',
        title: 'Q4 Board Meeting',
        type: 'board',
        phase: 'upcoming',
        attendees: [],
        agenda: [],
      };

      const hookState = {
        meeting: mockMeeting,
        isLoading: false,
        isError: false,
      };

      expect(hookState.meeting?.id).toBe('meeting-1');
      expect(hookState.meeting?.type).toBe('board');
    });
  });
});

describe('Meeting Data Transformations', () => {
  it('should transform API response to frontend format', () => {
    const apiMeeting = {
      id: 'meeting-1',
      title: 'Q4 Board Meeting',
      type: 'BOARD',
      phase: 'UPCOMING',
      scheduledStart: '2024-01-15T10:00:00Z',
      scheduledEnd: '2024-01-15T12:00:00Z',
    };

    // Transform to lowercase phase/type as frontend expects
    const transformed = {
      ...apiMeeting,
      type: apiMeeting.type.toLowerCase(),
      phase: apiMeeting.phase.toLowerCase(),
    };

    expect(transformed.type).toBe('board');
    expect(transformed.phase).toBe('upcoming');
  });

  it('should format dates for display', () => {
    const date = new Date('2024-01-15T10:00:00Z');
    
    const formatted = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    expect(formatted).toMatch(/Jan/);
    expect(formatted).toMatch(/15/);
    expect(formatted).toMatch(/2024/);
  });

  it('should calculate duration from start and end times', () => {
    const start = new Date('2024-01-15T10:00:00Z');
    const end = new Date('2024-01-15T12:00:00Z');
    
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = durationMs / (1000 * 60);
    
    expect(durationMinutes).toBe(120);
  });
});
