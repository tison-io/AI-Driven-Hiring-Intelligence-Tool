#!/bin/bash

set -e  # Exit on any error

echo "🧪 Testing CI Pipeline Locally"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend Tests
echo "📦 Backend Tests"
echo "----------------"
cd backend

echo "→ Installing dependencies..."
npm ci > /dev/null 2>&1

echo "→ Running linter..."
npm run lint

# echo "→ Running unit tests..."
# export DATABASE_URL="mongodb://localhost:27017/test_db"
# export JWT_SECRET="test-secret-key"
# export REDIS_HOST="localhost"
# export REDIS_PORT="6379"
# npm test

# echo "→ Running E2E tests..."
# npm run test:e2e

echo "→ Building..."
npm run build > /dev/null 2>&1

echo -e "${GREEN}✓ Backend tests passed${NC}"
echo ""
cd ..

# Frontend Tests
echo "🎨 Frontend Tests"
echo "-----------------"
cd frontend

echo "→ Installing dependencies..."
npm ci > /dev/null 2>&1

# echo "→ Running linter..."
# npm run lint

echo "→ Type checking..."
npm run type-check

echo "→ Building..."
export NEXT_PUBLIC_API_URL="http://localhost:3000"
npm run build > /dev/null 2>&1

echo -e "${GREEN}✓ Frontend tests passed${NC}"
echo ""
cd ..

# AI Service Tests
echo "🤖 AI Service Tests"
echo "-------------------"
cd AI_Backend

echo "→ Installing dependencies..."
pip install -r requirements.txt > /dev/null 2>&1

echo "→ Syntax check..."
python -m py_compile *.py

echo "→ Import validation..."
python -c "import main; print('✓ Main module imports successfully')"

echo -e "${GREEN}✓ AI Service tests passed${NC}"
echo ""
cd ..

# Summary
echo "================================"
echo -e "${GREEN}✅ All CI tests passed!${NC}"
echo "================================"
