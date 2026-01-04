# Local Development Guide

This guide explains how to set up and use the Kefir app backend for local development with minimal AWS costs.

## Overview

The local development setup maximizes local testing while using real AWS services only where necessary:

| Service | Local Development | AWS Usage | Cost |
|---------|------------------|-----------|------|
| **Lambda Functions** | Serverless Offline | None | $0 |
| **API Gateway** | Serverless Offline | None | $0 |
| **DynamoDB** | DynamoDB Local (Docker) | Optional | $0 |
| **S3** | Real AWS (recommended) | Minimal | ~$0.02/month |
| **Cognito** | Real AWS (required) | Test users | $0 (free tier) |
| **EventBridge** | Mocked locally | None | $0 |
| **CloudWatch** | Real AWS | Dev logs | $0 (free tier) |
| **Total** | | | **~$0.02/month** |

## Prerequisites

- ✅ **Node.js 18+** installed
- ✅ **Docker Desktop** running
- ✅ **AWS CLI** configured
- ✅ **tsx** installed globally: `npm install -g tsx`

## Quick Start

### 1. Initial Setup (First Time Only)

```bash
cd backend

# Install dependencies
npm install

# Start Docker services
npm run local:docker

# Setup local DynamoDB tables
npm run local:setup

# Seed test data
npm run local:seed
```

### 2. Deploy Minimal AWS Infrastructure

This creates only the essential AWS resources (Cognito, S3) that can't be mocked:

```bash
# Deploy with stage=local (uses minimal AWS)
npm run deploy:dev

# This will:
# - Create Cognito User Pool (free tier)
# - Create S3 bucket (minimal cost)
# - Deploy Lambda functions definitions
```

### 3. Start Development

```bash
# Start serverless offline
npm run dev

# API will be available at: http://localhost:3000
# DynamoDB Admin UI: http://localhost:8001
```

## Daily Development Workflow

### Starting Your Day

```bash
# 1. Ensure Docker is running
docker ps | grep dynamodb

# 2. If not running, start services
npm run local:docker

# 3. Start serverless offline
npm run dev
```

### Making Changes

1. **Edit Lambda function code** in `src/functions/`
2. Save the file
3. Serverless Offline automatically reloads
4. Test immediately via curl or frontend

No redeployment needed! ✨

### Testing

```bash
# Generate auth token (after deploying to dev)
export USER_POOL_ID="your-pool-id"
export CLIENT_ID="your-client-id"
npm run local:token

# Test authenticated endpoint
curl -H "Authorization: Bearer $ID_TOKEN" \
     http://localhost:3000/batches

# Test reminder scheduler
tsx local/mock-scheduler.ts

# Test push notifications
tsx local/mock-push.ts user123 "Test message"
```

### Ending Your Day

```bash
# Stop serverless offline
Ctrl+C

# Optional: Stop Docker (or leave running)
npm run local:docker:stop
```

## Available Scripts

### Setup & Management

```bash
# Start Docker services
npm run local:docker

# Stop Docker services
npm run local:docker:stop

# Setup local DynamoDB tables
npm run local:setup

# Reset database (delete all data)
npm run local:reset

# Seed test data
npm run local:seed

# Quick test (combines setup + seed + test)
npm run local:test
```

### Testing & Debugging

```bash
# Generate auth token for API testing
npm run local:token

# Test reminder processing
tsx local/mock-scheduler.ts

# Test push notifications
tsx local/mock-push.ts [userId] [message]
```

## Development Tools

### DynamoDB Admin UI

Visual interface for viewing/editing local DynamoDB data:

```bash
# Access at: http://localhost:8001
open http://localhost:8001
```

Features:
- Browse tables and items
- Run queries and scans
- Edit items directly
- Export data as JSON

### Testing Strategies

#### Manual API Testing

```bash
# Use httpie (better than curl)
brew install httpie

# Test endpoints
http GET localhost:3000/batches Authorization:"Bearer $TOKEN"
http POST localhost:3000/batches name="Test Batch" waterVolumeMl:=1000
```

## Common Tasks

### Create a Test User

```bash
# After deploying to dev and Cognito is created
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username test@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS

# Set permanent password
aws cognito-idp admin-set-user-password \
  --user-pool-id $USER_POOL_ID \
  --username test@example.com \
  --password TestPass123! \
  --permanent
```

### Reset to Clean State

```bash
# Delete all local data
npm run local:reset

# Reseed with test data
npm run local:seed
```

### Test Reminder Flow

```bash
# 1. Create a due reminder in DB
npm run local:seed

# 2. Trigger reminder check
tsx local/mock-scheduler.ts

# 3. Check console output for mock push notification
# 4. Verify reminder status in DynamoDB Admin
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Or use different port
npm run dev -- --port 3001
```

### DynamoDB Local Not Responding

```bash
# Check if container is running
docker ps | grep dynamodb

# Restart container
npm run local:docker:stop
npm run local:docker

# Check logs
docker logs kefir-dynamodb-local
```

### Lambda Function Not Updating

```bash
# Serverless Offline may need restart
Ctrl+C
npm run dev
```

### Can't Connect to Local Services

```bash
# Verify services are running
docker ps

# Check endpoints
curl http://localhost:8000  # DynamoDB
curl http://localhost:8001  # DynamoDB Admin
curl http://localhost:3000  # API

# Check environment variables
cat .env.local
```

## Best Practices

### 1. Use Consistent Test Data

```bash
# Always use same test user IDs
USER_ID="test123"
BATCH_ID="batch001"

# Makes debugging easier
# Predictable in logs
# Easy to query
```

### 2. Reset Between Test Runs

```bash
# Clean state prevents confusing bugs
npm run local:reset
npm run local:seed
```

### 3. Monitor Logs Actively

```bash
# Watch serverless offline console output
# Faster debugging
```

### 4. Use Mock Services

```bash
# Don't send real push notifications in dev
# Use mock-push.ts instead
# Saves costs and prevents spam
```

## Resources

- [Serverless Offline Documentation](https://github.com/dherault/serverless-offline)
- [DynamoDB Local Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

