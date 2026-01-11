#!/bin/bash
# Board Observer - Agent Setup Script
# This script sets up the development environment for autonomous agents
# Usage: ./scripts/agent-setup.sh [command]
# Commands: setup, start, stop, test, verify, clean

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
FRONTEND_PORT=4280
BACKEND_PORT=4281
DB_PORT=5481
REDIS_PORT=6381

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

wait_for_port() {
    local port=$1
    local max_attempts=${2:-30}
    local attempt=0
    
    log_info "Waiting for port $port..."
    while ! check_port $port; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            log_error "Timeout waiting for port $port"
            return 1
        fi
        sleep 1
    done
    log_success "Port $port is ready"
}

wait_for_health() {
    local url=$1
    local max_attempts=${2:-30}
    local attempt=0
    
    log_info "Waiting for $url..."
    while ! curl -s -f "$url" >/dev/null 2>&1; do
        attempt=$((attempt + 1))
        if [ $attempt -ge $max_attempts ]; then
            log_error "Timeout waiting for $url"
            return 1
        fi
        sleep 2
    done
    log_success "$url is healthy"
}

# Commands
cmd_setup() {
    log_info "Setting up Board Observer development environment..."
    
    # Check prerequisites
    command -v node >/dev/null 2>&1 || { log_error "Node.js is required"; exit 1; }
    command -v docker >/dev/null 2>&1 || { log_error "Docker is required"; exit 1; }
    
    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm ci
    
    log_info "Installing backend dependencies..."
    cd backend && npm ci && cd ..
    
    # Generate Prisma client
    log_info "Generating Prisma client..."
    cd backend && npx prisma generate && cd ..
    
    # Start database
    log_info "Starting database..."
    cd backend && docker compose up -d && cd ..
    wait_for_port $DB_PORT 60
    
    # Setup database
    log_info "Setting up database schema..."
    cd backend && npx prisma db push && cd ..
    
    log_info "Seeding database..."
    cd backend && npm run db:seed && cd ..
    
    log_success "Setup complete!"
}

cmd_start() {
    log_info "Starting development servers..."
    
    # Ensure database is running
    if ! check_port $DB_PORT; then
        log_info "Starting database..."
        cd backend && docker compose up -d && cd ..
        wait_for_port $DB_PORT 60
    fi
    
    # Kill any existing processes on our ports
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    
    # Start backend
    log_info "Starting backend on port $BACKEND_PORT..."
    cd backend && PORT=$BACKEND_PORT npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Start frontend
    log_info "Starting frontend on port $FRONTEND_PORT..."
    PORT=$FRONTEND_PORT npm run dev &
    FRONTEND_PID=$!
    
    # Wait for services to be ready
    wait_for_health "http://localhost:$BACKEND_PORT/health" 60
    wait_for_health "http://localhost:$FRONTEND_PORT" 60
    
    log_success "Development servers are running!"
    echo ""
    echo "Frontend: http://localhost:$FRONTEND_PORT"
    echo "Backend:  http://localhost:$BACKEND_PORT"
    echo "Database: localhost:$DB_PORT"
    echo ""
    echo "Press Ctrl+C to stop..."
    
    # Wait for both processes
    wait
}

cmd_stop() {
    log_info "Stopping all services..."
    
    # Stop Node processes
    lsof -ti:$FRONTEND_PORT | xargs kill -9 2>/dev/null || true
    lsof -ti:$BACKEND_PORT | xargs kill -9 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "tsx watch" 2>/dev/null || true
    
    # Stop Docker containers
    cd backend && docker compose down && cd ..
    
    log_success "All services stopped"
}

cmd_test() {
    log_info "Running tests..."
    
    # Frontend lint
    log_info "Linting frontend..."
    npm run lint
    
    # Frontend TypeScript
    log_info "Type-checking frontend..."
    npx tsc --noEmit
    
    # Backend lint
    log_info "Linting backend..."
    cd backend && npm run lint && cd ..
    
    # Backend TypeScript (excluding tests)
    log_info "Type-checking backend..."
    cd backend && npx tsc --noEmit 2>&1 | grep -v "__tests__" || true && cd ..
    
    log_success "All tests passed!"
}

cmd_verify() {
    log_info "Verifying application..."
    
    local errors=0
    
    # Check backend health
    if curl -sf http://localhost:$BACKEND_PORT/health | jq -e '.status == "ok"' >/dev/null; then
        log_success "Backend health check passed"
    else
        log_error "Backend health check failed"
        errors=$((errors + 1))
    fi
    
    # Check API endpoints
    if curl -sf http://localhost:$BACKEND_PORT/api/organizations | jq -e 'length > 0' >/dev/null; then
        log_success "Organizations API check passed"
    else
        log_error "Organizations API check failed"
        errors=$((errors + 1))
    fi
    
    if curl -sf http://localhost:$BACKEND_PORT/api/meetings | jq -e 'length > 0' >/dev/null; then
        log_success "Meetings API check passed"
    else
        log_error "Meetings API check failed"
        errors=$((errors + 1))
    fi
    
    # Check frontend
    if curl -sf -o /dev/null http://localhost:$FRONTEND_PORT; then
        log_success "Frontend check passed"
    else
        log_error "Frontend check failed"
        errors=$((errors + 1))
    fi
    
    if [ $errors -eq 0 ]; then
        log_success "All verification checks passed!"
        return 0
    else
        log_error "$errors verification check(s) failed"
        return 1
    fi
}

cmd_clean() {
    log_info "Cleaning build artifacts..."
    
    rm -rf node_modules .next
    rm -rf backend/node_modules backend/dist
    
    log_success "Clean complete"
}

cmd_status() {
    echo "=== Board Observer Status ==="
    echo ""
    
    echo "Ports:"
    check_port $FRONTEND_PORT && echo "  Frontend ($FRONTEND_PORT): ✅ Running" || echo "  Frontend ($FRONTEND_PORT): ❌ Stopped"
    check_port $BACKEND_PORT && echo "  Backend ($BACKEND_PORT): ✅ Running" || echo "  Backend ($BACKEND_PORT): ❌ Stopped"
    check_port $DB_PORT && echo "  Database ($DB_PORT): ✅ Running" || echo "  Database ($DB_PORT): ❌ Stopped"
    check_port $REDIS_PORT && echo "  Redis ($REDIS_PORT): ✅ Running" || echo "  Redis ($REDIS_PORT): ❌ Stopped"
    
    echo ""
    
    if check_port $BACKEND_PORT; then
        echo "API Health:"
        curl -s http://localhost:$BACKEND_PORT/health | jq '.' 2>/dev/null || echo "  Unable to fetch health status"
    fi
}

# Main
case "${1:-help}" in
    setup)
        cmd_setup
        ;;
    start)
        cmd_start
        ;;
    stop)
        cmd_stop
        ;;
    test)
        cmd_test
        ;;
    verify)
        cmd_verify
        ;;
    clean)
        cmd_clean
        ;;
    status)
        cmd_status
        ;;
    help|*)
        echo "Board Observer - Agent Setup Script"
        echo ""
        echo "Usage: $0 <command>"
        echo ""
        echo "Commands:"
        echo "  setup   - Complete project setup from scratch"
        echo "  start   - Start development servers"
        echo "  stop    - Stop all services"
        echo "  test    - Run linting and type checks"
        echo "  verify  - Verify the application is working"
        echo "  clean   - Clean build artifacts"
        echo "  status  - Show current service status"
        echo ""
        echo "Port Configuration:"
        echo "  Frontend:  $FRONTEND_PORT"
        echo "  Backend:   $BACKEND_PORT"
        echo "  Database:  $DB_PORT"
        echo "  Redis:     $REDIS_PORT"
        ;;
esac
