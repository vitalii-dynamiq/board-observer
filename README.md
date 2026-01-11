# Board Observer

AI-powered meeting intelligence platform for enterprise board governance. Provides real-time transcription, insights, action item detection, and meeting summarization.

## Features

- **Pre-Meeting Preparation**: Agenda management, briefing documents, AI-generated prep questions
- **Live Meeting Support**: Real-time transcription, AI insights, action/decision detection
- **Post-Meeting Summary**: Automated summaries, action item tracking, decision records
- **AI Agents**: Transcriber (Recall.ai), Advisor (OpenAI), TTS (ElevenLabs)
- **Multi-tenancy**: Support for multiple organizations with isolated data

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, ShadCN UI
- **Backend**: Node.js, Express, Socket.io, Prisma ORM
- **Database**: PostgreSQL
- **AI Services**: Recall.ai (transcription), OpenAI (advisor), ElevenLabs (TTS)
- **Styling**: IBM Plex Sans/Mono fonts, enterprise design system

## Port Configuration

> **⚠️ IMPORTANT: Non-Standard Ports**
>
> Board Observer uses non-standard ports to avoid conflicts with other local projects:
>
> | Service    | Port  | Default |
> |------------|-------|---------|
> | Frontend   | 4280  | 3000    |
> | Backend    | 4281  | 3001    |
> | PostgreSQL | 5481  | 5432    |
>
> These ports are configured in:
> - `.env.example` / `.env.local` (frontend)
> - `backend/.env.example` / `backend/.env` (backend)
> - `backend/docker-compose.yml` (database)
> - `docker-compose.yml` (full stack)

## Prerequisites

- Node.js 20+ (see `.nvmrc`)
- Docker & Docker Compose
- npm or yarn

## Quick Start

### Option 1: Using Make (Recommended)

```bash
# Complete setup (install deps, start db, seed data)
make setup

# Start development servers
make dev
```

### Option 2: Manual Setup

```bash
# 1. Install dependencies
npm ci
cd backend && npm ci

# 2. Copy environment files
cp .env.example .env.local
cp backend/.env.example backend/.env

# 3. Start PostgreSQL (port 5481)
cd backend && docker compose up -d

# 4. Setup database schema and seed data
cd backend && npx prisma generate
cd backend && npx prisma db push
cd backend && npm run db:seed

# 5. Start development servers (in separate terminals)
PORT=4280 npm run dev                # Frontend: http://localhost:4280
cd backend && PORT=4281 npm run dev  # Backend:  http://localhost:4281
```

### Option 3: Docker Compose (Full Stack)

```bash
# Build and start all services
docker compose up -d

# Or use Make
make docker-up
```

## Environment Configuration

### Step 1: Copy Example Files

```bash
cp .env.example .env.local
cp backend/.env.example backend/.env
```

### Step 2: Configure Frontend (.env.local)

```bash
# Backend API URL (port 4281)
NEXT_PUBLIC_API_URL=http://localhost:4281
```

### Step 3: Configure Backend (backend/.env)

```bash
# Database (port 5481 to avoid conflicts)
DATABASE_URL="postgresql://postgres:postgres@localhost:5481/board_observer?schema=public"

# Server ports
PORT=4281
FRONTEND_URL=http://localhost:4280

# AI Mode (true for development, false for production)
AI_MOCK_ENABLED=true

# For production, configure these API keys:
# RECALL_API_KEY=your-recall-api-key
# OPENAI_API_KEY=your-openai-api-key
# ELEVENLABS_API_KEY=your-elevenlabs-api-key
```

See `backend/.env.example` for all configuration options.

## Database Setup & Seeding

### Initial Setup

```bash
# Start PostgreSQL container (port 5481)
cd backend && docker compose up -d

# Generate Prisma client
cd backend && npx prisma generate

# Push schema to database
cd backend && npx prisma db push

# Seed with sample data
cd backend && npm run db:seed
```

### Seed Data Includes

The seed script (`backend/prisma/seed.ts`) creates:

- **5 Organizations**: Emirates Post, Abu Dhabi Dept of Finance, Abu Dhabi Dept of Health, Abu Dhabi Dept of Government Enablement, Mubadala Investment Company
- **Admin User**: `admin@boardobserver.ai` with access to all organizations
- **9 Attendees per org**: Board members, executives, and advisors
- **3 Meetings per org**: Live, upcoming, and completed meetings
- **Sample Data**: Agenda items, decisions, action items, transcripts

### Re-seeding Database

```bash
# Reset and re-seed (drops all data)
cd backend && npx prisma migrate reset

# Or just re-seed (adds to existing data)
cd backend && npm run db:seed
```

### Database Management

```bash
# Open Prisma Studio (visual database browser)
make db-studio
# or: cd backend && npx prisma studio

# View database directly
docker exec -it board-observer-postgres psql -U postgres -d board_observer
```

## Available Commands

### Make Commands

| Command | Description |
|---------|-------------|
| `make setup` | Complete project setup (install, db, seed) |
| `make dev` | Start frontend (4280) + backend (4281) |
| `make db-start` | Start PostgreSQL on port 5481 |
| `make db-stop` | Stop PostgreSQL container |
| `make db-setup` | Push schema + seed database |
| `make db-seed` | Re-seed database with sample data |
| `make db-studio` | Open Prisma Studio (visual DB browser) |
| `make lint` | Run all linters |
| `make build` | Build for production |
| `make docker-up` | Start full stack with Docker |
| `make docker-down` | Stop Docker services |
| `make clean` | Clean build artifacts |

### NPM Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

**Backend:**
- `npm run dev` - Start with hot reload
- `npm run build` - Compile TypeScript
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

## Project Structure

```
board-observer/
├── app/                    # Next.js app directory
│   └── (meetings)/         # Meeting routes
│       ├── [id]/
│       │   ├── prepare/    # Pre-meeting prep
│       │   ├── live/       # Live meeting view
│       │   └── summary/    # Post-meeting summary
│       └── page.tsx        # Meetings list
├── backend/
│   ├── src/
│   │   ├── routes/         # API endpoints
│   │   ├── services/ai/    # AI services (mocked)
│   │   └── websocket/      # Real-time events
│   └── prisma/
│       ├── schema.prisma   # Database schema
│       └── seed.ts         # Seed data
├── components/
│   ├── forms/              # CRUD forms
│   ├── layout/             # App shell
│   ├── live/               # Live meeting components
│   ├── post/               # Post-meeting components
│   └── prepare/            # Pre-meeting components
├── lib/
│   ├── api/                # API client
│   ├── hooks/              # React hooks
│   └── mock-data/          # Mock data for development
├── docker-compose.yml      # Full stack Docker
├── Makefile                # Development commands
└── AGENTS.md               # AI integration guide
```

## API Endpoints

### Meetings
- `GET /api/meetings` - List meetings
- `POST /api/meetings` - Create meeting
- `GET /api/meetings/:id` - Get meeting details
- `PUT /api/meetings/:id` - Update meeting
- `POST /api/meetings/:id/start` - Start meeting
- `POST /api/meetings/:id/end` - End meeting

### Agenda
- `GET /api/meetings/:id/agenda` - Get agenda items
- `POST /api/meetings/:id/agenda` - Add agenda item
- `PUT /api/meetings/:id/agenda/:itemId` - Update item
- `DELETE /api/meetings/:id/agenda/:itemId` - Delete item

### Live Meeting (AI - Mocked)
- `GET /api/meetings/:id/transcript` - Get transcript
- `GET /api/meetings/:id/insights` - Get AI insights
- `GET /api/meetings/:id/detected-actions` - AI-detected actions

See `backend/README.md` for complete API documentation.

## WebSocket Events

Connect to `ws://localhost:4281` for real-time updates:

- `transcript-update` - New transcript entry
- `insight-generated` - New AI insight
- `action-detected` - Action item detected
- `agent-status-change` - Agent status update

## AI Integration

AI features are currently mocked. See [AGENTS.md](./AGENTS.md) for:

- Integration point documentation
- Environment configuration
- Implementation guides
- WebSocket event details

To enable real AI:
1. Set `AI_MOCK_ENABLED=false` in backend/.env
2. Configure AI service credentials
3. Implement service adapters

## Development

### Database Management

```bash
# Open Prisma Studio
make db-studio
# or
cd backend && npx prisma studio

# Reset database
cd backend && npx prisma migrate reset

# Create migration
cd backend && npx prisma migrate dev --name your_migration_name
```

### Linting

```bash
# Lint all code
make lint

# Lint with auto-fix
npm run lint -- --fix
cd backend && npm run lint:fix
```

### Building

```bash
# Build all
make build

# Build frontend only
npm run build

# Build backend only
cd backend && npm run build
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running on port 5481
docker ps | grep board-observer-postgres

# Check container logs
docker logs board-observer-postgres

# Restart database
cd backend && docker compose restart

# Test connection
cd backend && npx prisma db pull
```

### Port Conflicts

Board Observer uses unique ports to avoid conflicts:

| Service    | Port | Check Command |
|------------|------|---------------|
| Frontend   | 4280 | `lsof -i :4280` |
| Backend    | 4281 | `lsof -i :4281` |
| PostgreSQL | 5481 | `lsof -i :5481` |

If you need to change ports, update these files:
1. `.env.local` → `NEXT_PUBLIC_API_URL`
2. `backend/.env` → `DATABASE_URL`, `PORT`, `FRONTEND_URL`
3. `backend/docker-compose.yml` → db port mapping
4. `docker-compose.yml` → all service ports
5. `Makefile` → port references in commands

### Clean Install

```bash
# Stop all containers
make docker-down
cd backend && docker compose down

# Clean everything
make clean

# Fresh setup
make setup
```

### Common Issues

**"Cannot connect to database"**
- Ensure PostgreSQL is running: `docker ps | grep postgres`
- Verify port 5481 is not in use: `lsof -i :5481`
- Check DATABASE_URL in `backend/.env`

**"EADDRINUSE" error**
- Another process is using the port
- Kill the process: `kill $(lsof -t -i:4280)` or `kill $(lsof -t -i:4281)`

**"Prisma schema out of sync"**
```bash
cd backend && npx prisma db push --force-reset
cd backend && npm run db:seed
```

## Testing

```bash
# Run backend tests
cd backend && npm test

# Run frontend tests
npm test

# Run with coverage
cd backend && npm run test:coverage
npm run test:coverage
```

## Production Deployment

See [AGENTS.md](./AGENTS.md) for AI service configuration and production setup.

```bash
# Build for production
make build

# Run with Docker
docker compose -f docker-compose.prod.yml up -d
```

## License

Proprietary - All rights reserved.
