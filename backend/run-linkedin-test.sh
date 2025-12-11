#!/bin/bash

echo "🧪 LinkedIn Profile Processing Integration Test"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MongoDB is running
echo "📦 Checking prerequisites..."
if ! mongosh --eval "db.version()" > /dev/null 2>&1; then
    echo -e "${RED}❌ MongoDB is not running${NC}"
    echo "   Start it with: mongod"
    exit 1
fi
echo -e "${GREEN}✓ MongoDB is running${NC}"

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo -e "${RED}❌ Redis is not running${NC}"
    echo "   Start it with: redis-server"
    exit 1
fi
echo -e "${GREEN}✓ Redis is running${NC}"

# Check if RAPIDAPI_KEY is set
if ! grep -q "RAPIDAPI_KEY=" .env 2>/dev/null || grep -q "RAPIDAPI_KEY=$" .env 2>/dev/null; then
    echo -e "${RED}❌ RAPIDAPI_KEY is not set in .env${NC}"
    echo "   Add your RapidAPI key to .env file"
    exit 1
fi
echo -e "${GREEN}✓ RAPIDAPI_KEY is configured${NC}"

echo ""
echo "🚀 Running Test 1: Valid LinkedIn URL Processing..."
echo ""

# Run the test
npm run test:e2e linkedin-processing.e2e-spec.ts

# Check exit code
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Test 1 PASSED!${NC}"
    echo ""
    echo "📊 Next steps:"
    echo "   1. Review test results above"
    echo "   2. Check performance metrics"
    echo "   3. Proceed to Test 2 (Invalid URL)"
else
    echo ""
    echo -e "${RED}❌ Test 1 FAILED${NC}"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Check backend logs"
    echo "   2. Verify RapidAPI quota"
fi
