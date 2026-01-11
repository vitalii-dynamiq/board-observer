# Board Observer - Development Makefile
# Usage: make <target>

.PHONY: help setup install dev dev-frontend dev-backend db-start db-stop db-setup db-seed db-studio lint lint-frontend lint-backend build build-frontend build-backend docker-up docker-down docker-build clean

# Default target
help:
	@echo "Board Observer - Available Commands"
	@echo ""
	@echo "Setup & Installation:"
	@echo "  make setup        - Complete project setup (install deps, setup db)"
	@echo "  make install      - Install all dependencies"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start both frontend and backend in development mode"
	@echo "  make dev-frontend - Start frontend only"
	@echo "  make dev-backend  - Start backend only"
	@echo ""
	@echo "Database:"
	@echo "  make db-start     - Start PostgreSQL container"
	@echo "  make db-stop      - Stop PostgreSQL container"
	@echo "  make db-setup     - Push schema and seed database"
	@echo "  make db-seed      - Seed database with sample data"
	@echo "  make db-studio    - Open Prisma Studio"
	@echo ""
	@echo "Code Quality:"
	@echo "  make lint         - Run linters on all code"
	@echo "  make lint-frontend - Lint frontend code"
	@echo "  make lint-backend  - Lint backend code"
	@echo ""
	@echo "Build:"
	@echo "  make build        - Build both frontend and backend"
	@echo "  make build-frontend - Build frontend only"
	@echo "  make build-backend  - Build backend only"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up    - Start full stack with Docker Compose"
	@echo "  make docker-down  - Stop Docker Compose services"
	@echo "  make docker-build - Build Docker images"
	@echo ""
	@echo "Utilities:"
	@echo "  make clean        - Clean build artifacts and node_modules"

# ============================================
# SETUP & INSTALLATION
# ============================================

setup: install db-start db-setup
	@echo "✅ Setup complete! Run 'make dev' to start development."

install:
	@echo "📦 Installing frontend dependencies..."
	npm ci
	@echo "📦 Installing backend dependencies..."
	cd backend && npm ci
	@echo "📦 Generating Prisma client..."
	cd backend && npx prisma generate

# ============================================
# DEVELOPMENT
# ============================================

dev:
	@echo "🚀 Starting development servers..."
	@echo "Frontend: http://localhost:4280"
	@echo "Backend:  http://localhost:4281"
	@echo ""
	@make -j2 dev-frontend dev-backend

dev-frontend:
	PORT=4280 npm run dev

dev-backend:
	cd backend && PORT=4281 npm run dev

# ============================================
# DATABASE
# ============================================

db-start:
	@echo "🐘 Starting PostgreSQL..."
	cd backend && docker compose up -d
	@echo "⏳ Waiting for database to be ready..."
	@sleep 3
	@echo "✅ Database is running on port 5481"

db-stop:
	@echo "🛑 Stopping PostgreSQL..."
	cd backend && docker compose down

db-setup:
	@echo "📊 Setting up database schema..."
	cd backend && npx prisma db push
	@echo "🌱 Seeding database..."
	cd backend && npm run db:seed

db-seed:
	@echo "🌱 Seeding database..."
	cd backend && npm run db:seed

db-studio:
	@echo "🎨 Opening Prisma Studio..."
	cd backend && npx prisma studio

# ============================================
# CODE QUALITY
# ============================================

lint: lint-frontend lint-backend
	@echo "✅ All linting complete"

lint-frontend:
	@echo "🔍 Linting frontend..."
	npm run lint

lint-backend:
	@echo "🔍 Linting backend..."
	cd backend && npm run lint

# ============================================
# BUILD
# ============================================

build: build-backend build-frontend
	@echo "✅ Build complete"

build-frontend:
	@echo "🏗️  Building frontend..."
	npm run build

build-backend:
	@echo "🏗️  Building backend..."
	cd backend && npm run build

# ============================================
# DOCKER
# ============================================

docker-up:
	@echo "🐳 Starting full stack with Docker..."
	docker compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo ""
	@echo "✅ Services are running:"
	@echo "   Frontend: http://localhost:4280"
	@echo "   Backend:  http://localhost:4281"
	@echo "   Database: localhost:5481"

docker-down:
	@echo "🛑 Stopping Docker services..."
	docker compose down

docker-build:
	@echo "🏗️  Building Docker images..."
	docker compose build

# ============================================
# UTILITIES
# ============================================

clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf .next
	rm -rf backend/dist
	rm -rf node_modules
	rm -rf backend/node_modules
	@echo "✅ Clean complete"
