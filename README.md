# Board Observer

AI-powered meeting intelligence platform for enterprise board governance. Provides real-time transcription, insights, action item detection, and meeting summarization.

## Features

- **Pre-Meeting Preparation**: Agenda management, briefing documents, AI-generated prep questions
- **Live Meeting Support**: Real-time transcription, AI insights, action/decision detection
- **Post-Meeting Summary**: Automated summaries, action item tracking, decision records
- **AI Agents**: Transcriber, Analyst, Tracker, and Advisor agents (currently mocked)

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, ShadCN UI
- **Backend**: Node.js, Express, Socket.io, Prisma ORM
- **Database**: PostgreSQL
- **Styling**: IBM Plex Sans/Mono fonts, enterprise design system

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
# Install dependencies
npm ci
cd backend && npm ci

# Start PostgreSQL
cd backend && docker-compose up -d

# Setup database
cd backend && npx prisma generate
cd backend && npx prisma db push
cd backend && npm run db:seed

# Start development servers (in separate terminals)
npm run dev          # Frontend on http://localhost:3000
cd backend && npm run dev  # Backend on http://localhost:3001
```

### Option 3: Docker Compose (Full Stack)

```bash
# Build and start all services
docker-compose up -d

# Or use Make
make docker-up
```

## Environment Configuration

Copy the example environment files:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

### Frontend (.env)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Backend (backend/.env)

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/board_observer?schema=public"
PORT=3001
FRONTEND_URL=http://localhost:3000
AI_MOCK_ENABLED=true
```

## Available Commands

### Make Commands

| Command | Description |
|---------|-------------|
| `make setup` | Complete project setup |
| `make dev` | Start frontend + backend |
| `make db-start` | Start PostgreSQL |
| `make db-setup` | Push schema + seed data |
| `make db-studio` | Open Prisma Studio |
| `make lint` | Run all linters |
| `make build` | Build for production |
| `make docker-up` | Start with Docker |
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

Connect to `ws://localhost:3001` for real-time updates:

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
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
cd backend && docker-compose restart

# Check connection
cd backend && npx prisma db pull
```

### Port Conflicts

Default ports:
- Frontend: 3000
- Backend: 3001
- PostgreSQL: 5432

To change, update `.env` files and `docker-compose.yml`.

### Clean Install

```bash
make clean
make setup
```

## License

Proprietary - All rights reserved.
