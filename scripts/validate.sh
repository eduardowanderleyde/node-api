#!/bin/bash

# Enterprise Microservices Platform - Validation Script
# Developed by Wander

set -e

echo "🔍 Starting validation process..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed"
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Run linting
echo "🔍 Running ESLint..."
npm run lint

# Run tests
echo "🧪 Running tests..."
npm run test:coverage

# Check test coverage
echo "📊 Checking test coverage..."
if [ -f "coverage/lcov.info" ]; then
    echo "✅ Coverage report generated"
else
    echo "❌ Coverage report not found"
    exit 1
fi

# Security audit
echo "🔒 Running security audit..."
npm audit --audit-level=moderate

echo "✅ All validations passed!"
echo "🚀 Ready for deployment" 