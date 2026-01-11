/**
 * Test setup file for Vitest
 * Runs before each test file
 */

import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.AI_MOCK_ENABLED = 'true';
process.env.RECALL_API_KEY = 'test-recall-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ELEVENLABS_API_KEY = 'test-elevenlabs-key';

// Create mock functions for Prisma
const createMockModel = () => ({
  findMany: vi.fn().mockResolvedValue([]),
  findUnique: vi.fn().mockResolvedValue(null),
  findFirst: vi.fn().mockResolvedValue(null),
  create: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockResolvedValue({}),
  delete: vi.fn().mockResolvedValue({}),
  deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  count: vi.fn().mockResolvedValue(0),
});

// Mock Prisma client - must be before any imports that use it
vi.mock('../../lib/prisma', () => ({
  default: {
    meeting: createMockModel(),
    meetingAttendee: createMockModel(),
    agendaItem: createMockModel(),
    actionItem: createMockModel(),
    decision: createMockModel(),
    transcriptEntry: createMockModel(),
    liveInsight: createMockModel(),
    meetingBot: createMockModel(),
    detectedAction: createMockModel(),
    detectedDecision: createMockModel(),
    briefingDocument: createMockModel(),
    prepQuestion: createMockModel(),
    meetingSummary: createMockModel(),
    agentInsight: createMockModel(),
    $connect: vi.fn().mockResolvedValue(undefined),
    $disconnect: vi.fn().mockResolvedValue(undefined),
    $transaction: vi.fn((fn) => fn({
      meeting: createMockModel(),
      meetingBot: createMockModel(),
    })),
  },
}));

// Mock external API clients
vi.mock('../../services/recall/client', () => ({
  createBot: vi.fn().mockResolvedValue({ id: 'mock-bot-id', status: 'ready' }),
  deleteBot: vi.fn().mockResolvedValue(undefined),
  getBot: vi.fn().mockResolvedValue({ id: 'mock-bot-id', status: 'in_call_recording' }),
  leaveBot: vi.fn().mockResolvedValue(undefined),
  outputAudio: vi.fn().mockResolvedValue(undefined),
  sendChatMessage: vi.fn().mockResolvedValue(undefined),
  getRecording: vi.fn().mockResolvedValue({
    video_url: 'https://test.com/video.mp4',
    transcript_url: 'https://test.com/transcript.txt',
    duration: 3600,
    status: 'available',
  }),
}));

vi.mock('../../services/openai/client', () => ({
  openai: {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue({
          choices: [{ message: { content: 'Test response' } }],
        }),
      },
    },
  },
}));

vi.mock('../../services/elevenlabs/client', () => ({
  textToSpeech: vi.fn().mockResolvedValue(Buffer.from('audio-data')),
  isConfigured: vi.fn(() => true),
  PROFESSIONAL_VOICES: {},
  DEFAULT_VOICE_ID: 'test-voice',
  DEFAULT_MODEL_ID: 'test-model',
}));

// Mock logger to reduce noise in tests
vi.mock('../../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    })),
  },
  webhookLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  botLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  agentLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  wakeWordLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  apiLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Global setup
beforeAll(() => {
  // Any global setup
});

// Global teardown
afterAll(() => {
  // Any global teardown
});
