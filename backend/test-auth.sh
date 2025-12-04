#!/bin/bash

echo "🧪 Running Authentication Unit Tests..."
echo "======================================"

# Install dependencies if not already installed
echo "📦 Installing test dependencies..."
npm install

# Run authentication-specific tests
echo "🔐 Running AuthService tests..."
npm test -- --testPathPattern=auth.service.spec.ts

echo "🔑 Running JwtStrategy tests..."
npm test -- --testPathPattern=jwt.strategy.spec.ts

echo "👤 Running UsersService tests..."
npm test -- --testPathPattern=users.service.spec.ts

echo "🎮 Running AuthController tests..."
npm test -- --testPathPattern=auth.controller.spec.ts

# Run all authentication tests with coverage
echo "📊 Running all authentication tests with coverage..."
npm test -- --testPathPattern="(auth|users)" --coverage

echo "✅ Authentication tests completed!"
echo "📈 Check coverage report in ./coverage/lcov-report/index.html"