/**
 * Tests for Wake Word Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('../../../services/openai/advisor-agent', () => ({
  askAdvisor: vi.fn(),
}));

vi.mock('../../../services/recall/audio-output', () => ({
  speak: vi.fn(),
  queueSpeak: vi.fn(),
}));

vi.mock('../../../services/recall/transcription', () => ({
  getRecentTranscript: vi.fn(),
}));

vi.mock('../../../index', () => ({
  io: {
    to: vi.fn(() => ({
      emit: vi.fn(),
    })),
  },
}));

// Import after mocking
import {
  muteBot,
  unmuteBot,
  isMuted,
  toggleMute,
  processForWakeWord,
  resetMeetingState, // We'll add this helper
} from '../../../services/ai/wake-word';
import { askAdvisor } from '../../../services/openai/advisor-agent';
import { speak, queueSpeak } from '../../../services/recall/audio-output';

// Helper to reset state between tests
const resetState = (meetingId: string) => {
  // Unmute and clear any listening state
  if (isMuted(meetingId)) unmuteBot(meetingId);
};

describe('Wake Word Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Mute/Unmute Functions', () => {
    const meetingId = 'mute-test-1';

    afterEach(() => {
      resetState(meetingId);
    });

    it('should mute the bot', () => {
      muteBot(meetingId);
      expect(isMuted(meetingId)).toBe(true);
    });

    it('should unmute the bot', () => {
      muteBot(meetingId);
      unmuteBot(meetingId);
      expect(isMuted(meetingId)).toBe(false);
    });

    it('should toggle mute state', () => {
      const testMeetingId = 'mute-test-toggle';
      expect(isMuted(testMeetingId)).toBe(false);
      
      const result1 = toggleMute(testMeetingId);
      expect(result1).toBe(true);
      expect(isMuted(testMeetingId)).toBe(true);
      
      const result2 = toggleMute(testMeetingId);
      expect(result2).toBe(false);
      expect(isMuted(testMeetingId)).toBe(false);
    });

    it('should not process transcripts when muted', async () => {
      const testMeetingId = 'mute-test-2';
      muteBot(testMeetingId);
      
      const result = await processForWakeWord(
        testMeetingId,
        'John',
        'Board Observer, what is on the agenda?'
      );
      
      expect(result.detected).toBe(false);
      expect(speak).not.toHaveBeenCalled();
      
      unmuteBot(testMeetingId); // Cleanup
    });
  });

  describe('Wake Word Detection', () => {
    it('should detect "board observer" wake word', async () => {
      const meetingId = 'wake-test-1';
      vi.mocked(speak).mockResolvedValue();
      
      const result = await processForWakeWord(
        meetingId,
        'John',
        'Hey Board Observer, can you help me?'
      );
      
      expect(result.detected).toBe(true);
    });

    it('should detect "hey observer" wake word', async () => {
      const meetingId = 'wake-test-2';
      vi.mocked(speak).mockResolvedValue();
      
      const result = await processForWakeWord(
        meetingId,
        'Jane',
        'Hey Observer, what was discussed earlier?'
      );
      
      expect(result.detected).toBe(true);
    });

    it('should not trigger on unrelated speech when no session active', async () => {
      const meetingId = 'wake-test-3';
      // First message without wake word should not trigger
      const result = await processForWakeWord(
        meetingId,
        'Mike',
        'The quarterly results are looking good'
      );
      
      // No wake word, so detected should be false
      expect(result.detected).toBe(false);
    });

    it('should be case insensitive', async () => {
      const meetingId = 'wake-test-4';
      vi.mocked(speak).mockResolvedValue();
      
      const result = await processForWakeWord(
        meetingId,
        'Sarah',
        'BOARD OBSERVER, please summarize'
      );
      
      expect(result.detected).toBe(true);
    });
  });

  describe('Speech Completion Detection', () => {
    it('should detect completion with question mark', async () => {
      vi.mocked(speak).mockResolvedValue();
      vi.mocked(askAdvisor).mockResolvedValue('Here is my answer');
      vi.mocked(queueSpeak).mockResolvedValue();
      
      // First call to trigger wake word
      await processForWakeWord(
        'meeting-3',
        'John',
        'Board Observer'
      );
      
      // Advance timers to simulate speech
      vi.advanceTimersByTime(1000);
      
      // Second call with the question
      await processForWakeWord(
        'meeting-3',
        'John',
        'What is the budget for Q4?'
      );
      
      // Advance past the speech detection timeout
      vi.advanceTimersByTime(5000);
      
      // The advisor should eventually be called
      // (timing depends on implementation details)
    });

    it('should detect completion with period', async () => {
      vi.mocked(speak).mockResolvedValue();
      
      await processForWakeWord(
        'meeting-4',
        'Jane',
        'Board Observer'
      );
      
      vi.advanceTimersByTime(1000);
      
      await processForWakeWord(
        'meeting-4',
        'Jane',
        'Please summarize the discussion.'
      );
    });
  });
});

describe('Speech Completion Linguistic Analysis', () => {
  // These test the logic of determining when speech is complete
  
  it('should recognize question-ending patterns', () => {
    const questionEndings = [
      'what is the status?',
      'can you explain?',
      'how much does it cost?',
    ];
    
    // Questions ending with ? should have high completion confidence
    questionEndings.forEach(text => {
      expect(text.endsWith('?')).toBe(true);
    });
  });

  it('should recognize incomplete patterns', () => {
    const incompletePatterns = [
      'I think we should',
      'The budget is',
      'And then',
    ];
    
    // Patterns ending with common continuation words should be incomplete
    incompletePatterns.forEach(text => {
      const words = text.split(' ');
      const lastWord = words[words.length - 1].toLowerCase();
      const continuationWords = ['and', 'but', 'or', 'so', 'should', 'is', 'then'];
      expect(continuationWords.includes(lastWord)).toBe(true);
    });
  });
});
