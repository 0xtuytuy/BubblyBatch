#!/bin/bash

# Unset AWS profile to avoid credential issues in offline mode
unset AWS_PROFILE
unset AWS_DEFAULT_PROFILE

# Set offline mode and disable AWS SDK config loading
export IS_OFFLINE=true
export AWS_SDK_LOAD_CONFIG=0

# Set local environment variables
export TABLE_NAME=kefir-local-table
export BUCKET_NAME=kefir-photos-local
export USER_POOL_ID=local-pool
export USER_POOL_CLIENT_ID=local-client
export SCHEDULER_GROUP_NAME=kefir-reminders-local
export STAGE=local
export AWS_REGION=us-east-1
export AWS_ACCOUNT_ID=916767170641
export DYNAMODB_ENDPOINT=http://localhost:8000

echo ""
echo "========================================"
echo "🚀 Kefir Backend - Local Development"
echo "========================================"
echo ""
echo "📡 Endpoints:"
echo "   API: http://localhost:3000"
echo "   DynamoDB: http://localhost:8000"
echo "   DynamoDB Admin: http://localhost:8001"
echo ""
echo "👤 Test User:"
echo "   Email: test@example.com"
echo "   User ID: test123"
echo ""
echo "🔑 Authentication (add header):"
echo "   X-User-Id: test123"
echo ""
echo "📝 Quick test:"
echo "   curl -H \"X-User-Id: test123\" http://localhost:3000/batches"
echo ""
echo "⚡️ Starting Serverless Offline..."
echo "========================================"
echo ""

# Start serverless offline
serverless offline --stage local --noAuth

