# Board Observer Backend

Node.js/Express backend with PostgreSQL database for the Board Observer meeting intelligence platform.

## Prerequisites

- Node.js 18+
- Docker (for PostgreSQL) or local PostgreSQL installation

## Quick Start

### 1. Start the Database

Using Docker Compose (recommended):
```bash
docker-compose up -d
```

Or start PostgreSQL manually and create a database named `board_observer`.

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

The `.env` file should already exist with:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/board_observer?schema=public"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Initialize Database

```bash
# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at http://localhost:3001

## API Endpoints

### Meetings
- `GET /api/meetings` - List all meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Get meeting details
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting
- `POST /api/meetings/:id/start` - Start meeting (go live)
- `POST /api/meetings/:id/end` - End meeting

### Attendees
- `GET /api/attendees` - List all attendees
- `POST /api/attendees` - Create attendee
- `GET /api/attendees/:id` - Get attendee details
- `POST /api/meetings/:id/attendees` - Add attendee to meeting

### Agenda
- `GET /api/meetings/:id/agenda` - Get agenda items
- `POST /api/meetings/:id/agenda` - Add agenda item
- `PUT /api/meetings/:id/agenda/:itemId` - Update agenda item
- `DELETE /api/meetings/:id/agenda/:itemId` - Delete agenda item

### Documents
- `GET /api/meetings/:id/documents` - Get documents
- `POST /api/meetings/:id/documents` - Add document

### Actions
- `GET /api/meetings/:id/actions` - Get action items
- `POST /api/meetings/:id/actions` - Create action item
- `PUT /api/meetings/:id/actions/:actionId` - Update action

### Decisions
- `GET /api/meetings/:id/decisions` - Get decisions
- `POST /api/meetings/:id/decisions` - Record decision

### Live Meeting (AI Features - Mocked)
- `GET /api/meetings/:id/transcript` - Get transcript
- `GET /api/meetings/:id/insights` - Get AI insights
- `GET /api/meetings/:id/detected-actions` - Get AI-detected actions
- `POST /api/meetings/:id/summary/generate` - Generate AI summary

## WebSocket Events

Connect to the WebSocket at `ws://localhost:3001`

### Client -> Server
- `join-meeting` - Join meeting room for real-time updates
- `leave-meeting` - Leave meeting room
- `start-recording` - Start meeting recording
- `stop-recording` - Stop recording
- `confirm-action` - Confirm detected action
- `dismiss-insight` - Dismiss an insight

### Server -> Client
- `transcript-update` - New transcript entry
- `insight-generated` - New AI insight
- `action-detected` - Action item detected
- `decision-detected` - Decision detected
- `agent-status-change` - AI agent status update

## AI Integration Points

The codebase is prepared for real AI integration. Look for `@AI-INTEGRATION-POINT` comments in:

- `src/services/ai/transcript.ts` - Real-time transcription
- `src/services/ai/insights.ts` - Meeting insights
- `src/services/ai/detection.ts` - Action/decision detection
- `src/services/ai/summary.ts` - Meeting summarization
- `src/services/ai/agents.ts` - Agent status management

To integrate with a real agentic platform:
1. Set `AI_MOCK_ENABLED=false` in `.env`
2. Set `AI_SERVICE_URL` to your platform URL
3. Replace mock functions with real API calls
4. Connect WebSocket to agent event streams

## Database Management

```bash
# View database in browser
npm run db:studio

# Create migration
npm run db:migrate

# Reset database
npx prisma migrate reset
```
