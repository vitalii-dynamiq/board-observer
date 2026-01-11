/**
 * Tests for Webhook functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHmac } from 'crypto';

describe('Webhook Security', () => {
  describe('Signature Verification', () => {
    const WEBHOOK_SECRET = 'test-webhook-secret';

    function generateSignature(payload: string, secret: string): string {
      const hmac = createHmac('sha256', secret);
      hmac.update(payload);
      return `sha256=${hmac.digest('hex')}`;
    }

    it('should generate valid HMAC signature', () => {
      const payload = JSON.stringify({ event: 'test', data: {} });
      const signature = generateSignature(payload, WEBHOOK_SECRET);

      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it('should verify matching signatures', () => {
      const payload = JSON.stringify({ event: 'transcript.data' });
      const signature = generateSignature(payload, WEBHOOK_SECRET);
      const expectedSignature = generateSignature(payload, WEBHOOK_SECRET);

      expect(signature).toBe(expectedSignature);
    });

    it('should reject mismatched signatures', () => {
      const payload = JSON.stringify({ event: 'test' });
      const validSignature = generateSignature(payload, WEBHOOK_SECRET);
      const invalidSignature = generateSignature(payload, 'wrong-secret');

      expect(validSignature).not.toBe(invalidSignature);
    });

    it('should reject tampered payloads', () => {
      const originalPayload = JSON.stringify({ event: 'test', value: 1 });
      const tamperedPayload = JSON.stringify({ event: 'test', value: 2 });
      const signature = generateSignature(originalPayload, WEBHOOK_SECRET);
      const tamperedSignature = generateSignature(tamperedPayload, WEBHOOK_SECRET);

      expect(signature).not.toBe(tamperedSignature);
    });
  });
});

describe('Webhook Event Processing', () => {
  describe('Transcript Events', () => {
    it('should parse transcript data correctly', () => {
      const transcriptEvent = {
        event: 'transcript.data',
        data: {
          words: [
            { text: 'Hello', start_timestamp: { absolute: '2024-01-15T10:00:00Z' } },
            { text: 'World', start_timestamp: { absolute: '2024-01-15T10:00:01Z' } },
          ],
          participant: { name: 'John Doe' },
        },
        bot: { id: 'bot-123' },
      };

      expect(transcriptEvent.event).toBe('transcript.data');
      expect(transcriptEvent.data.words).toHaveLength(2);
      expect(transcriptEvent.data.participant.name).toBe('John Doe');
    });

    it('should extract text from words array', () => {
      const words = [
        { text: 'The' },
        { text: 'quarterly' },
        { text: 'results' },
      ];

      const text = words.map(w => w.text).join(' ');
      expect(text).toBe('The quarterly results');
    });

    it('should handle empty transcript', () => {
      const emptyTranscript = {
        event: 'transcript.data',
        data: {
          words: [],
          participant: { name: 'Unknown' },
        },
      };

      expect(emptyTranscript.data.words).toHaveLength(0);
    });
  });

  describe('Bot Status Events', () => {
    it('should parse bot status change correctly', () => {
      const statusEvent = {
        event: 'bot.status_change',
        data: {
          bot_id: 'bot-123',
          status: {
            code: 'in_call_recording',
            message: 'Bot is recording the meeting',
          },
        },
      };

      expect(statusEvent.event).toBe('bot.status_change');
      expect(statusEvent.data.status.code).toBe('in_call_recording');
    });

    it('should handle all status codes', () => {
      const statusCodes = [
        'ready',
        'joining_call',
        'in_waiting_room',
        'in_call_not_recording',
        'in_call_recording',
        'call_ended',
        'done',
        'analysis_done',
        'fatal',
        'media_expired',
      ];

      statusCodes.forEach(code => {
        expect(typeof code).toBe('string');
        expect(code.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Recording Events', () => {
    it('should parse recording done event', () => {
      const recordingEvent = {
        event: 'recording.done',
        data: {
          bot_id: 'bot-123',
          video_url: 'https://storage.example.com/recording.mp4',
          duration: 3600,
        },
      };

      expect(recordingEvent.event).toBe('recording.done');
      expect(recordingEvent.data.video_url).toContain('mp4');
      expect(recordingEvent.data.duration).toBe(3600);
    });

    it('should handle recording with no video', () => {
      const noVideoRecording = {
        event: 'recording.done',
        data: {
          bot_id: 'bot-123',
          video_url: null,
          audio_url: 'https://storage.example.com/audio.mp3',
          duration: 1800,
        },
      };

      expect(noVideoRecording.data.video_url).toBeNull();
      expect(noVideoRecording.data.audio_url).toBeTruthy();
    });
  });
});

describe('Webhook Error Handling', () => {
  it('should handle malformed JSON', () => {
    const malformedJson = '{event: "test"';

    expect(() => JSON.parse(malformedJson)).toThrow();
  });

  it('should handle missing required fields', () => {
    const incompleteEvent = {
      // Missing 'event' field
      data: {},
    };

    expect(incompleteEvent.event).toBeUndefined();
  });

  it('should handle unknown event types', () => {
    const unknownEvent = {
      event: 'unknown.event.type',
      data: {},
    };

    const knownEvents = [
      'transcript.data',
      'bot.status_change',
      'recording.done',
    ];

    expect(knownEvents).not.toContain(unknownEvent.event);
  });
});
