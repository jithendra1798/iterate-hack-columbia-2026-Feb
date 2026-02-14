#!/bin/bash

# HEIST - Quick Start Script
# Starts both backend and frontend servers

set -e

echo "=========================================="
echo "       🎯 HEIST - Starting Up 🎯         "
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check for required environment variables
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${RED}ERROR: ANTHROPIC_API_KEY not set${NC}"
    echo "Run: export ANTHROPIC_API_KEY=your_key"
    exit 1
fi

echo -e "${GREEN}✓ ANTHROPIC_API_KEY is set${NC}"

# Check for optional ElevenLabs key
if [ -z "$ELEVENLABS_API_KEY" ]; then
    echo -e "${YELLOW}⚠ ELEVENLABS_API_KEY not set - CIPHER will be silent${NC}"
else
    echo -e "${GREEN}✓ ELEVENLABS_API_KEY is set${NC}"
fi

echo ""

# Kill any existing processes on our ports
echo -e "${CYAN}Cleaning up old processes...${NC}"
lsof -ti:8000 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
sleep 1

# Start backend
echo -e "${CYAN}Starting backend server on port 8000...${NC}"
cd "$(dirname "$0")"
python server.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo -e "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo -e "${CYAN}Waiting for backend...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}ERROR: Backend failed to start${NC}"
        echo "Check /tmp/backend.log for details"
        cat /tmp/backend.log
        exit 1
    fi
    sleep 0.5
done

# Start frontend
echo -e "${CYAN}Starting frontend on port 8080...${NC}"
cd frontend
npm run dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "Frontend PID: $FRONTEND_PID"

# Wait for frontend to be ready
echo -e "${CYAN}Waiting for frontend...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:8080/ > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Frontend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}ERROR: Frontend failed to start${NC}"
        echo "Check /tmp/frontend.log for details"
        cat /tmp/frontend.log
        exit 1
    fi
    sleep 0.5
done

echo ""
echo "=========================================="
echo -e "${GREEN}        🎯 HEIST IS READY 🎯            ${NC}"
echo "=========================================="
echo ""
echo -e "Frontend: ${CYAN}http://localhost:8080/${NC}"
echo -e "Backend:  ${CYAN}http://localhost:8000/${NC}"
echo -e "Health:   ${CYAN}http://localhost:8000/health${NC}"
echo ""
echo -e "Backend log:  /tmp/backend.log"
echo -e "Frontend log: /tmp/frontend.log"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Trap Ctrl+C to cleanup
cleanup() {
    echo ""
    echo -e "${CYAN}Shutting down...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo -e "${GREEN}Done!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait
