# Board Observer Backend

Node.js/Express backend with PostgreSQL database for the Board Observer meeting intelligence platform.

## Port Configuration

> **⚠️ IMPORTANT: Non-Standard Ports**
>
> Board Observer uses non-standard ports to avoid conflicts:
>
> | Service    | Port  | Default |
> |------------|-------|---------|
> | Backend    | 4281  | 3001    |
> | PostgreSQL | 5481  | 5432    |
> | Frontend   | 4280  | 3000    |

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

## Quick Start

### 1. Start the Database

```bash
# Start PostgreSQL on port 5481
docker compose up -d
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment

Copy the example environment file:
```bash
cp .env.example .env
```

Key settings in `.env`:
```bash
# Database (port 5481)
DATABASE_URL="postgresql://postgres:postgres@localhost:5481/board_observer?schema=public"

# Server (port 4281)
PORT=4281
FRONTEND_URL=http://localhost:4280

# AI Mode (true for development)
AI_MOCK_ENABLED=true
```

### 4. Initialize Database

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
# or with explicit port:
PORT=4281 npm run dev
```

The API will be available at http://localhost:4281

## Database Seeding

The seed script (`prisma/seed.ts`) creates comprehensive sample data:

### Organizations (5)
- Emirates Post
- Abu Dhabi Department of Finance
- Abu Dhabi Department of Health
- Abu Dhabi Department of Government Enablement
- Mubadala Investment Company

### Per Organization
- 9 Attendees (Board Chair, CEO, CFO, CRO, CISO, General Counsel, etc.)
- 3 Meetings (1 live, 1 upcoming, 1 completed)
- Agenda items, decisions, action items

### Admin User
- Email: `admin@boardobserver.ai`
- Access to all organizations

### Seeding Commands

```bash
# Full seed (clears existing data)
npm run db:seed

# Reset and re-seed
npx prisma migrate reset

# View data in Prisma Studio
npm run db:studio
```

## API Endpoints

### Organizations
- `GET /api/organizations` - List all organizations
- `GET /api/organizations/:slug` - Get organization by slug

### Meetings
- `GET /api/meetings` - List all meetings (filter by `organizationId`)
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Get meeting details
- `PUT /api/meetings/:id` - Update meeting
- `DELETE /api/meetings/:id` - Delete meeting
- `POST /api/meetings/:id/start` - Start meeting (go live)
- `POST /api/meetings/:id/end` - End meeting

### Attendees
- `GET /api/attendees` - List attendees (filter by `organizationId`)
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

### Bot Management (Recall.ai)
- `POST /api/meetings/:id/bot/join` - Send bot to meeting
- `POST /api/meetings/:id/bot/leave` - Remove bot
- `GET /api/meetings/:id/bot/status` - Get bot status
- `POST /api/meetings/:id/bot/speak` - Make bot speak (TTS)
- `GET /api/meetings/:id/bot/recording` - Get recording info

### Advisor Agent (OpenAI)
- `POST /api/meetings/:id/agent/ask` - Ask advisor a question
- `GET /api/meetings/:id/agent/status` - Get agent status

### Webhooks
- `POST /webhooks/recall` - Recall.ai webhook endpoint
- `GET /webhooks/recall/health` - Webhook health check

## WebSocket Events

Connect to `ws://localhost:4281`

### Client -> Server
- `join-meeting` - Join meeting room for real-time updates
- `leave-meeting` - Leave meeting room
- `start-recording` - Start meeting recording
- `stop-recording` - Stop recording
- `confirm-action` - Confirm detected action
- `dismiss-insight` - Dismiss an insight

### Server -> Client
- `transcript-update` - New transcript entry
- `transcript-live` - Partial live transcript
- `advisor-insight` - New AI insight
- `advisor-speaking` - Agent is speaking
- `bot-status-change` - Bot status update
- `recording-done` - Recording completed

## AI Integration

See [../AGENTS.md](../AGENTS.md) for detailed AI integration documentation.

### Mock Mode (Development)
```bash
AI_MOCK_ENABLED=true
```

### Production Mode
```bash
AI_MOCK_ENABLED=false
RECALL_API_KEY=your-key
OPENAI_API_KEY=your-key
ELEVENLABS_API_KEY=your-key
```

## Database Management

```bash
# Open Prisma Studio (visual database browser)
npm run db:studio
# or: npx prisma studio

# Push schema changes
npm run db:push

# Create migration
npx prisma migrate dev --name your_migration_name

# Reset database (drops all data)
npx prisma migrate reset

# View database directly
docker exec -it board-observer-postgres psql -U postgres -d board_observer
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Building

```bash
# Compile TypeScript
npm run build

# Run production build
npm start
```
