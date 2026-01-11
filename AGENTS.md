# AI Agents Integration Guide

This document describes how AI features are implemented in Board Observer and how to integrate real AI services.

## Overview

Board Observer uses AI agents for real-time meeting intelligence:

- **Transcriber Agent**: Real-time speech-to-text via **Recall.ai** + **AssemblyAI**
- **Advisor Agent**: Contextual suggestions and recommendations via **OpenAI**
- **Voice Agent**: Text-to-speech responses via **ElevenLabs**

The platform supports two modes:
1. **Mock Mode** (`AI_MOCK_ENABLED=true`): Simulated AI for development/testing
2. **Production Mode** (`AI_MOCK_ENABLED=false`): Real AI via external services

## Port Configuration

> **⚠️ IMPORTANT: Non-Standard Ports**
>
> | Service    | Port | Default |
> |------------|------|---------|
> | Frontend   | 4280 | 3000    |
> | Backend    | 4281 | 3001    |
> | PostgreSQL | 5481 | 5432    |
> | Redis      | 6381 | 6379    |

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Meeting Platforms                                   │
│                 (Zoom / Google Meet / Microsoft Teams)                       │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Recall.ai Bot                                      │
│  • Joins meeting via Meeting Bot API                                         │
│  • Real-time transcription streaming (AssemblyAI)                           │
│  • Audio output for agent responses                                         │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ Webhooks
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Board Observer Backend (port 4281)                        │
│                                                                              │
│  ┌────────────────┐     ┌────────────────┐     ┌────────────────┐           │
│  │  Recall.ai     │     │   Transcript   │     │    OpenAI      │           │
│  │  Webhook       │────▶│    Buffer      │────▶│   Advisor      │           │
│  │  Handler       │     │                │     │   Agent        │           │
│  └────────────────┘     └────────────────┘     └───────┬────────┘           │
│                                                         │                    │
│                                                         ▼                    │
│  ┌────────────────┐                           ┌────────────────┐            │
│  │   ElevenLabs   │◀──────────────────────────│   Response     │            │
│  │   TTS Engine   │                           │   Router       │            │
│  └───────┬────────┘                           └────────────────┘            │
│          │                                                                   │
└──────────┼───────────────────────────────────────────────────────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────────┐   ┌──────────────────────┐
│   Recall.ai Bot      │   │   Frontend Chat      │
│   (Audio Output)     │   │   (WebSocket)        │
└──────────────────────┘   └──────────────────────┘
```

## Environment Configuration

```bash
# backend/.env

# ==================================
# PORT CONFIGURATION
# ==================================
# Non-standard ports to avoid conflicts
PORT=4281
FRONTEND_URL=http://localhost:4280
DATABASE_URL="postgresql://postgres:postgres@localhost:5481/board_observer"

# ==================================
# AI MODE
# ==================================
# Set to false for production
AI_MOCK_ENABLED=false

# ==================================
# RECALL.AI (Meeting Bot & Recording)
# ==================================
# Get your API key from: https://recall.ai
RECALL_API_KEY=your-recall-api-key
RECALL_WEBHOOK_SECRET=your-webhook-secret
RECALL_API_URL=https://us-west-2.recall.ai/api/v1
RECALL_REGION=us-west-2

# Webhook URL (must be publicly accessible)
WEBHOOK_BASE_URL=https://your-domain.com

# ==================================
# OPENAI (Advisor Agent)
# ==================================
# Get your API key from: https://platform.openai.com
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4o-mini
AGENT_MAX_TOKENS=200

# ==================================
# ELEVENLABS (Text-to-Speech)
# ==================================
# Get your API key from: https://elevenlabs.io
ELEVENLABS_API_KEY=your-elevenlabs-api-key
ELEVENLABS_VOICE_ID=nPczCjzI2devNBz1zQrb  # Brian - Professional male voice
ELEVENLABS_MODEL=eleven_flash_v2_5         # Fast, low-latency model

# ==================================
# ASSEMBLYAI (Speech-to-Text)
# ==================================
# Get your API key from: https://assemblyai.com
ASSEMBLYAI_API_KEY=your-assemblyai-api-key

# ==================================
# PROVIDER SELECTION
# ==================================
TTS_PROVIDER=elevenlabs
TRANSCRIPTION_PROVIDER=assembly_ai

# ==================================
# AGENT BEHAVIOR
# ==================================
AGENT_SPEAK_COOLDOWN=30              # Seconds between spoken responses
TRANSCRIPT_BUFFER_SECONDS=5          # Buffer window before AI analysis
WAKE_WORD_COOLDOWN_SECONDS=0         # Cooldown after wake word detection
LISTENING_TIMEOUT_SECONDS=15         # Max time to listen after wake word
SPEECH_CONTINUITY_WINDOW_SECONDS=2   # Gap allowed in speech
STANDARD_PAUSE_SECONDS=1.5           # Pause before responding
QUICK_RESPONSE_PAUSE_SECONDS=0.8     # Pause for quick responses
MIN_WORDS_FOR_COMPLETION=3           # Min words to consider speech complete

# ==================================
# REDIS (Rate Limiting)
# ==================================
REDIS_URL=redis://localhost:6381
```

## Service Integration

### 1. Recall.ai (Meeting Bot)

Recall.ai provides:
- Meeting bot that joins Zoom/Meet/Teams
- Real-time transcription streaming
- Audio output for agent responses

**Setup:**
1. Create account at https://recall.ai
2. Get API key from dashboard
3. Configure webhook URL in Recall.ai dashboard
4. Set `RECALL_API_KEY` and `RECALL_WEBHOOK_SECRET`

**Backend Services:** `backend/src/services/recall/`
| File | Purpose |
|------|---------|
| `client.ts` | Recall.ai API client |
| `bot.ts` | Bot lifecycle management |
| `webhooks.ts` | Webhook event handlers |
| `transcription.ts` | Transcript processing |
| `audio-output.ts` | Audio output to meeting |

### 2. OpenAI (Advisor Agent)

OpenAI provides:
- Real-time transcript analysis
- Contextual recommendations
- Risk alert detection

**Setup:**
1. Create account at https://platform.openai.com
2. Generate API key
3. Set `OPENAI_API_KEY`

**Backend Services:** `backend/src/services/openai/`
| File | Purpose |
|------|---------|
| `client.ts` | OpenAI API configuration |
| `prompts.ts` | System prompts |
| `advisor-agent.ts` | Insight generation |

### 3. ElevenLabs (Text-to-Speech)

ElevenLabs provides:
- Natural-sounding voice synthesis
- Multiple voice options
- Low-latency streaming

**Setup:**
1. Create account at https://elevenlabs.io
2. Get API key
3. Choose a voice ID (default: Brian)
4. Set `ELEVENLABS_API_KEY`

**Backend Services:** `backend/src/services/elevenlabs/`
| File | Purpose |
|------|---------|
| `client.ts` | ElevenLabs API client |
| `index.ts` | TTS generation |

**Available Voices:**
| Voice ID | Name | Description |
|----------|------|-------------|
| `nPczCjzI2devNBz1zQrb` | Brian | Professional male (default) |
| `EXAVITQu4vr4xnSDxMaL` | Sarah | Professional female |
| `21m00Tcm4TlvDq8ikWAM` | Rachel | Warm female |

### 4. AssemblyAI (Speech-to-Text)

AssemblyAI provides:
- High-accuracy transcription
- Real-time streaming via Recall.ai

**Setup:**
1. Create account at https://assemblyai.com
2. Get API key
3. Set `ASSEMBLYAI_API_KEY`

## API Endpoints

### Bot Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meetings/:id/bot/join` | POST | Send bot to meeting |
| `/api/meetings/:id/bot/leave` | POST | Remove bot from meeting |
| `/api/meetings/:id/bot/status` | GET | Get bot status |
| `/api/meetings/:id/bot/speak` | POST | Make bot speak (TTS) |
| `/api/meetings/:id/bot/message` | POST | Send chat message |
| `/api/meetings/:id/bot/mute` | POST | Mute bot |
| `/api/meetings/:id/bot/unmute` | POST | Unmute bot |
| `/api/meetings/:id/bot/recording` | GET | Get recording info |

### Advisor Agent

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meetings/:id/agent/status` | GET | Get agent status |
| `/api/meetings/:id/agent/ask` | POST | Ask advisor a question |
| `/api/meetings/:id/agent/insights` | GET | Get insights history |

### Webhooks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhooks/recall` | POST | Receive Recall.ai events |
| `/webhooks/recall/health` | GET | Health check |

## WebSocket Events

Connect to `ws://localhost:4281`

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `transcript-update` | `{ id, speaker, content, timestamp }` | Final transcript |
| `transcript-live` | `{ speaker, text, isFinal }` | Live transcript |
| `advisor-insight` | `{ id, type, priority, content }` | New insight |
| `advisor-speaking` | `{ content }` | Agent speaking |
| `bot-status-change` | `{ status, message }` | Bot status update |
| `recording-done` | `{ videoUrl, duration }` | Recording complete |

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-meeting` | `meetingId` | Join meeting room |
| `leave-meeting` | `meetingId` | Leave meeting room |
| `ask-agent` | `{ meetingId, question }` | Ask advisor |
| `confirm-action` | `{ meetingId, actionId }` | Confirm action |
| `dismiss-insight` | `{ meetingId, insightId }` | Dismiss insight |

## Advisor Agent Behavior

The Advisor agent:

1. **Buffers Transcript**: Accumulates transcript before analysis
2. **Analyzes Context**: Sends to OpenAI with meeting context
3. **Generates Insights**: Creates recommendations or alerts
4. **Routes Response**:
   - High priority → Speaks aloud + chat
   - Medium/Low → Chat only
5. **Respects Cooldown**: Minimum 30 seconds between spoken responses

### Insight Types

| Type | Description | Spoken |
|------|-------------|--------|
| `recommendation` | Strategic suggestions | If high priority |
| `risk_alert` | Risk considerations | Always |
| `question` | Clarifying questions | If high priority |
| `context` | Background information | Never |

## Database Models

```prisma
// Tracks Recall.ai bot instances
model MeetingBot {
  id            String    @id @default(uuid())
  meetingId     String    @unique
  recallBotId   String    @unique
  status        String    // created, joining, in_meeting, left
  joinedAt      DateTime?
  leftAt        DateTime?
  recordingUrl  String?
  transcriptUrl String?
}

// Insights from OpenAI Advisor
model AgentInsight {
  id            String    @id @default(uuid())
  meetingId     String
  type          String    // recommendation, question, risk_alert, context
  priority      String    // high, medium, low
  content       String
  wasSpoken     Boolean
  confidence    Float
  timestamp     DateTime
}
```

## Testing

### Mock Mode (Development)

```bash
# Set in backend/.env
AI_MOCK_ENABLED=true

# Start services
make dev
```

Mock services generate realistic data without API costs.

### Production Mode

```bash
# Set in backend/.env
AI_MOCK_ENABLED=false
RECALL_API_KEY=your-key
OPENAI_API_KEY=your-key
ELEVENLABS_API_KEY=your-key
ASSEMBLYAI_API_KEY=your-key

# Start services
make dev
```

### Testing Checklist

- [ ] Bot joins meeting successfully
- [ ] Transcription streams to backend
- [ ] Advisor generates insights
- [ ] TTS works (bot speaks)
- [ ] WebSocket events received in frontend
- [ ] Recording saves after meeting ends

## Troubleshooting

### Bot Won't Join Meeting

1. Verify `RECALL_API_KEY` is valid
2. Check meeting URL format is supported
3. Check Recall.ai dashboard for bot status
4. Ensure webhook URL is publicly accessible

### No Transcription

1. Verify webhook URL is correct in Recall.ai dashboard
2. Check `RECALL_WEBHOOK_SECRET` matches
3. Look for webhook events in backend logs
4. Verify AssemblyAI key is configured

### Advisor Not Responding

1. Check `OPENAI_API_KEY` is valid
2. Verify transcript buffer is receiving data
3. Check backend logs for errors
4. Ensure `AI_MOCK_ENABLED=false`

### TTS Not Working

1. Ensure bot is in `in_meeting` status
2. Check `ELEVENLABS_API_KEY` is valid
3. Verify speak cooldown hasn't been hit
4. Check ElevenLabs quota isn't exceeded

### WebSocket Issues

```javascript
// Test in browser console
const socket = io('ws://localhost:4281');
socket.on('connect', () => console.log('Connected'));
socket.on('transcript-update', (data) => console.log('Transcript:', data));
socket.on('advisor-insight', (data) => console.log('Insight:', data));
```

## Production Deployment

### Requirements

1. **Publicly accessible webhook URL** for Recall.ai
2. **SSL certificate** for production webhook
3. **Redis instance** for rate limiting
4. **PostgreSQL database** for persistence

### Environment Variables

All sensitive keys should be stored in environment variables or secrets manager:

```bash
# Required for production
RECALL_API_KEY
RECALL_WEBHOOK_SECRET
OPENAI_API_KEY
ELEVENLABS_API_KEY
ASSEMBLYAI_API_KEY
DATABASE_URL
REDIS_URL
WEBHOOK_BASE_URL
```

### Docker Deployment

```bash
# Build and start all services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose ps

# View logs
docker compose logs -f backend
```
