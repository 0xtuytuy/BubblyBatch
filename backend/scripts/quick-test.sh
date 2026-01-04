#!/bin/bash

# Quick Test Script for Local Development
# Sets up local environment and runs common test scenarios

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

echo "🚀 Quick Test Script"
echo "===================="
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running${NC}"
  echo "Please start Docker Desktop and try again"
  exit 1
fi

# Check if DynamoDB Local is running
if ! curl -s http://localhost:8000 > /dev/null 2>&1; then
  echo -e "${YELLOW}⚠️  DynamoDB Local not running${NC}"
  echo "Starting Docker services..."
  docker-compose up -d
  echo "Waiting for services to be ready..."
  sleep 5
fi

echo -e "${GREEN}✓ Docker services running${NC}"
echo

# Setup local tables
echo "📦 Setting up local DynamoDB tables..."
if [ "$1" == "--reset" ]; then
  tsx scripts/reset-local-db.ts --confirm
fi

tsx scripts/setup-local-dynamo.ts
echo

# Seed test data
echo "🌱 Seeding test data..."
tsx scripts/seed-dev.ts --local
echo

# Generate test token (if Cognito is configured)
if [ -n "$USER_POOL_ID" ] && [ -n "$CLIENT_ID" ]; then
  echo "🔐 Generating test auth token..."
  tsx scripts/generate-test-token.ts
else
  echo -e "${YELLOW}⚠️  USER_POOL_ID and CLIENT_ID not set${NC}"
  echo "Skipping token generation"
  echo "Set these after deploying: npm run deploy:dev"
fi
echo

# Test reminder scheduler
echo "🔔 Testing reminder scheduler..."
tsx local/mock-scheduler.ts
echo

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Quick test complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "📊 View Data:"
echo "  DynamoDB Admin: http://localhost:8001"
echo
echo "🚀 Next Steps:"
echo "  1. Start local dev: npm run dev"
echo "  2. Test API: curl http://localhost:3000/public/b/batch001"
echo
echo "Optional: Start dev mode with --dev flag"
echo

# Optional: Start dev
if [ "$1" == "--dev" ]; then
  echo "Starting local dev mode..."
  npm run dev
fi

