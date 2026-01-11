# AI Agents Integration Guide

This document describes how AI features are implemented in Board Observer and how to integrate real AI services.

## Overview

Board Observer uses AI agents for real-time meeting intelligence:

- **Transcriber Agent**: Real-time speech-to-text transcription via **Recall.ai**
- **Advisor Agent**: Provides contextual suggestions, risk alerts, and recommendations via **OpenAI**

The platform supports two modes:
1. **Mock Mode** (`AI_MOCK_ENABLED=true`): Simulated AI for development/testing
2. **Production Mode** (`AI_MOCK_ENABLED=false`): Real AI via Recall.ai + OpenAI

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
│  • Real-time transcription streaming                                         │
│  • Text-to-speech output (agent speaks in meeting)                          │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │ Webhooks
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Board Observer Backend                                 │
│                                                                              │
│  ┌────────────────┐     ┌────────────────┐     ┌────────────────┐           │
│  │  Recall.ai     │     │   Transcript   │     │    OpenAI      │           │
│  │  Webhook       │────▶│    Buffer      │────▶│   Advisor      │           │
│  │  Handler       │     │    (5 sec)     │     │   Agent        │           │
│  └────────────────┘     └────────────────┘     └───────┬────────┘           │
│                                                         │                    │
│                                                         ▼                    │
│                                                 ┌────────────────┐           │
│                                                 │   Response     │           │
│                                                 │   Router       │           │
│                                                 └───────┬────────┘           │
│                                                         │                    │
└─────────────────────────────────────────────────────────┼────────────────────┘
                               │                          │
             ┌─────────────────┴──────────────────────────┘
             ▼                                            ▼
┌──────────────────────┐                    ┌──────────────────────┐
│   Frontend Chat      │                    │   Recall.ai TTS      │
│   (WebSocket)        │                    │   (Bot speaks)       │
└──────────────────────┘                    └──────────────────────┘
```

## Environment Configuration

```bash
# backend/.env

# Database (port 5481 to avoid conflicts)
DATABASE_URL="postgresql://postgres:postgres@localhost:5481/board_observer"

# AI Mode: Set to false for production
AI_MOCK_ENABLED=false

# ============================================
# RECALL.AI (Meeting Recording & Transcription)
# ============================================
RECALL_API_KEY=your-recall-api-key
RECALL_WEBHOOK_SECRET=your-webhook-secret
RECALL_API_URL=https://api.recall.ai/api/v1

# ============================================
# OPENAI (Advisor Agent)
# ============================================
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4-turbo-preview

# ============================================
# AGENT CONFIGURATION
# ============================================
AGENT_SPEAK_COOLDOWN=30        # Seconds between spoken responses
TRANSCRIPT_BUFFER_SECONDS=5     # Buffer window before AI analysis
AGENT_MAX_TOKENS=500           # Max tokens per response
```

## Backend Services

### Recall.ai Services (`backend/src/services/recall/`)

| File | Purpose |
|------|---------|
| `client.ts` | Recall.ai API client wrapper |
| `bot.ts` | Bot lifecycle management (join, leave, status) |
| `webhooks.ts` | Webhook handlers for real-time events |
| `transcription.ts` | Transcript buffering and processing |
| `audio-output.ts` | Text-to-speech via OpenAI + Recall.ai |

### OpenAI Services (`backend/src/services/openai/`)

| File | Purpose |
|------|---------|
| `client.ts` | OpenAI API client configuration |
| `prompts.ts` | System prompts for advisor agent |
| `advisor-agent.ts` | Real-time analysis and insight generation |

## API Endpoints

### Bot Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meetings/:id/bot/join` | POST | Send Recall.ai bot to meeting |
| `/api/meetings/:id/bot/leave` | POST | Remove bot from meeting |
| `/api/meetings/:id/bot/status` | GET | Get current bot status |
| `/api/meetings/:id/bot/speak` | POST | Make bot speak (TTS) |
| `/api/meetings/:id/bot/message` | POST | Send chat message only |

### Advisor Agent

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/meetings/:id/agent/enable` | POST | Enable advisor for meeting |
| `/api/meetings/:id/agent/disable` | POST | Disable advisor |
| `/api/meetings/:id/agent/status` | GET | Get agent status |
| `/api/meetings/:id/agent/config` | PUT | Update agent configuration |
| `/api/meetings/:id/agent/insights` | GET | Get agent insights history |
| `/api/meetings/:id/agent/ask` | POST | Ask advisor a question |
| `/api/meetings/:id/agent/speak` | POST | Force agent to speak |

### Webhooks

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhooks/recall` | POST | Receive Recall.ai events |
| `/webhooks/recall/health` | GET | Health check for webhook |

## WebSocket Events

### Server -> Client

| Event | Payload | Description |
|-------|---------|-------------|
| `transcript-update` | `{ id, speaker, content, timestamp, confidence }` | Final transcript entry |
| `transcript-live` | `{ speaker, text, isFinal }` | Partial live transcript |
| `advisor-insight` | `{ id, type, priority, content, wasSpoken, timestamp }` | New advisor insight |
| `advisor-speaking` | `{ content }` | Agent is speaking in meeting |
| `bot-status-change` | `{ status, message }` | Recall.ai bot status update |
| `recording-done` | `{ videoUrl, duration }` | Recording completed |

### Client -> Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join-meeting` | `meetingId` | Join meeting room |
| `leave-meeting` | `meetingId` | Leave meeting room |
| `start-recording` | `meetingId` | Start recording (enables AI) |
| `stop-recording` | `meetingId` | Stop recording |
| `ask-agent` | `{ meetingId, question }` | Ask advisor a question |
| `confirm-action` | `{ meetingId, actionId, ... }` | Confirm detected action |
| `dismiss-insight` | `{ meetingId, insightId }` | Dismiss an insight |

## Database Models

### New Models for AI Integration

```prisma
// Tracks Recall.ai bot instances
model MeetingBot {
  id            String    @id @default(uuid())
  meetingId     String    @unique
  recallBotId   String    @unique
  status        String    // created, joining, in_meeting, left, etc.
  joinedAt      DateTime?
  leftAt        DateTime?
}

// Insights from OpenAI Advisor agent
model AgentInsight {
  id            String    @id @default(uuid())
  meetingId     String
  type          String    // recommendation, question, risk_alert, context
  priority      String    // high, medium, low
  content       String
  wasSpoken     Boolean   // Whether agent spoke this aloud
  confidence    Float
  timestamp     DateTime
}
```

## Advisor Agent Behavior

The Advisor agent:

1. **Buffers Transcript**: Accumulates 5 seconds of transcript before analysis
2. **Analyzes Context**: Sends buffered transcript + meeting context to OpenAI
3. **Generates Insights**: Creates recommendations, risk alerts, or questions
4. **Routes Response**:
   - High priority → Speaks aloud + sends to chat
   - Medium/Low → Sends to chat only
5. **Respects Cooldown**: Minimum 30 seconds between spoken responses

### Insight Types

| Type | Description | Spoken |
|------|-------------|--------|
| `recommendation` | Strategic suggestions | If high priority |
| `risk_alert` | Risk considerations | Always |
| `question` | Clarifying questions | If high priority |
| `context` | Background information | Never |

## Testing

### Mock Mode (Development)

1. Start with `AI_MOCK_ENABLED=true`
2. Mock services generate realistic data
3. Test UI/UX without API costs

### Production Mode

1. Set `AI_MOCK_ENABLED=false`
2. Configure Recall.ai and OpenAI keys
3. Set webhook URL in Recall.ai dashboard
4. Join a test meeting to verify:
   - Bot joins successfully
   - Transcription streams to backend
   - Advisor generates insights
   - TTS works (bot speaks)

### WebSocket Testing

Open browser console and run:
```javascript
// Check socket connection
socket.connected // should be true

// Listen for events
socket.on('advisor-insight', (data) => console.log('Insight:', data));
socket.on('transcript-update', (data) => console.log('Transcript:', data));
```

## Troubleshooting

### Bot Won't Join Meeting

1. Check `RECALL_API_KEY` is valid
2. Verify meeting URL format is supported
3. Check Recall.ai dashboard for bot status

### No Transcription

1. Verify webhook URL is accessible
2. Check webhook secret matches
3. Look for webhook events in backend logs

### Advisor Not Responding

1. Check `OPENAI_API_KEY` is valid
2. Verify agent is enabled for meeting
3. Check transcript buffer is receiving data

### TTS Not Working

1. Ensure bot is in `in_meeting` status
2. Check speak cooldown hasn't been hit
3. Verify OpenAI TTS quota isn't exceeded
