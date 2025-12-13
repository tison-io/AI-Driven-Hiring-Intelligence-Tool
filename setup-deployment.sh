#!/bin/bash

echo "🚀 AI-Driven Hiring Intelligence Tool - Deployment Setup"
echo "=========================================================="
echo ""

# Check if required tools are installed
command -v git >/dev/null 2>&1 || { echo "❌ Git is required but not installed. Aborting."; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed. Aborting."; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "⚠️  Docker not found. Docker deployment will not be available."; }

echo "✅ Prerequisites check passed"
echo ""

# Test CI pipeline locally
echo "📋 Testing CI Pipeline..."
echo ""

echo "1️⃣  Testing Backend..."
cd backend
npm install
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

echo ""
echo "2️⃣  Testing Frontend..."
cd frontend
npm install
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo ""
echo "3️⃣  Testing AI Service..."
cd AI_Backend
pip install -r requirements.txt
if [ $? -eq 0 ]; then
    echo "✅ AI Service dependencies installed"
else
    echo "❌ AI Service setup failed"
    exit 1
fi
cd ..

echo ""
echo "=========================================================="
echo "✅ All builds successful!"
echo ""
echo "Next steps:"
echo "1. Push code to GitHub"
echo "2. Set up deployment platforms (see DEPLOYMENT_GUIDE.md)"
echo "3. Configure environment variables"
echo "4. Enable GitHub Actions"
echo ""
echo "📖 Read DEPLOYMENT_GUIDE.md for detailed instructions"
echo "=========================================================="
