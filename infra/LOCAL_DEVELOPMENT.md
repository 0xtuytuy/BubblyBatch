# Local Development Guide

This guide explains how to set up and use the Kefir app infrastructure for local development with minimal AWS costs.

## Overview

The local development setup maximizes local testing while using real AWS services only where necessary:

| Service | Local Development | AWS Usage | Cost |
|---------|------------------|-----------|------|
| **Lambda Functions** | Run locally with hot reload | None | $0 |
| **API Gateway** | Local proxy via SST | None | $0 |
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
- ✅ **Git** for version control
- ✅ **tsx** installed globally: `npm install -g tsx`

## Quick Start

### 1. Initial Setup (First Time Only)

```bash
cd infra

# Install dependencies
npm install

# Start Docker services
docker-compose up -d

# Setup local DynamoDB tables
tsx scripts/setup-local-dynamo.ts

# Seed test data
tsx scripts/seed-dev.ts --local
```

### 2. Deploy Minimal AWS Infrastructure

This creates only the essential AWS resources (Cognito, S3) that can't be mocked:

```bash
# Deploy with stage=local (uses minimal AWS)
npm run dev

# This will:
# - Create Cognito User Pool (free tier)
# - Create S3 bucket (minimal cost)
# - Deploy Lambda functions locally
# - Start API Gateway proxy on localhost
# - Open SST Console
```

**Note**: First deployment takes ~5 minutes. Subsequent starts are <30 seconds.

### 3. Start Development

```bash
# SST dev mode is now running
# - API: http://localhost:3000
# - Console: http://localhost:13557
# - DynamoDB Admin: http://localhost:8001

# In another terminal, test the API
curl http://localhost:3000/public/b/batch001
```

## Daily Development Workflow

### Starting Your Day

```bash
# 1. Ensure Docker is running
docker ps | grep kefir

# 2. If not running, start services
docker-compose up -d

# 3. Start SST dev mode
npm run dev
```

### Making Changes

1. **Edit Lambda function code** in `../backend/src/functions/`
2. Save the file
3. Function automatically reloads in <1 second
4. Test immediately via curl or frontend

No redeployment needed! ✨

### Testing

```bash
# Generate auth token
export USER_POOL_ID="your-pool-id"  # From SST output
export CLIENT_ID="your-client-id"    # From SST output
tsx scripts/generate-test-token.ts

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
# Stop SST dev mode
Ctrl+C

# Optional: Stop Docker (or leave running)
docker-compose stop
```

## Configuration

### Environment Variables

Create `infra/.env.local`:

```bash
# SST Configuration
STAGE=local

# Local Services
USE_LOCAL_DYNAMODB=true
USE_LOCAL_S3=false
DYNAMODB_ENDPOINT=http://localhost:8000

# Test User (after Cognito is created)
USER_POOL_ID=us-east-1_xxxxx
CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=TestPass123!

# Optional: Store mock notifications in DB
STORE_MOCK_NOTIFICATIONS=true
```

### Using Local S3 (Optional)

By default, we use real AWS S3 (costs ~$0.02/month). To use LocalStack instead:

1. Uncomment LocalStack in `docker-compose.yml`
2. Set `USE_LOCAL_S3=true` in `.env.local`
3. Restart: `docker-compose up -d`

## Available Scripts

### Setup & Management

```bash
# Setup local DynamoDB tables
tsx scripts/setup-local-dynamo.ts

# Reset database (delete all data)
tsx scripts/reset-local-db.ts

# Seed test data
tsx scripts/seed-dev.ts --local

# Quick test (combines above)
./scripts/quick-test.sh
```

### Testing & Debugging

```bash
# Generate auth token for API testing
tsx scripts/generate-test-token.ts [email] [password]
tsx scripts/generate-test-token.ts --save  # Save to file

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

### SST Console

Powerful console for debugging:

```bash
# Access at: http://localhost:13557
open http://localhost:13557
```

Features:
- View logs in real-time
- Invoke functions directly
- Monitor function performance
- Inspect resource configuration

### VS Code Debugging

Attach debugger to running Lambda functions:

1. Add breakpoint in function code
2. Open VS Code debug panel
3. Select "Attach to Node"
4. Function will pause at breakpoint

## Testing Strategies

### Unit Testing

Test individual functions without AWS:

```typescript
// Test with mock AWS SDK clients
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const dynamoMock = mockClient(DynamoDBClient);
dynamoMock.on(PutItemCommand).resolves({});

// Your test here
```

### Integration Testing

Test against local DynamoDB:

```bash
# Ensure local services are running
docker-compose up -d

# Run integration tests
npm run test:integration
```

### End-to-End Testing

Test full flow with frontend:

1. Start infra: `npm run dev`
2. Start frontend in another terminal
3. Test user flows in app
4. Monitor logs in SST Console

### Manual API Testing

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
# After SST dev is running and Cognito is created
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
tsx scripts/reset-local-db.ts --confirm

# Reseed with test data
tsx scripts/seed-dev.ts --local

# Or do both at once
./scripts/quick-test.sh --reset
```

### Test Reminder Flow

```bash
# 1. Create a due reminder in DB
tsx scripts/seed-dev.ts --local

# 2. Trigger reminder check
tsx local/mock-scheduler.ts

# 3. Check console output for mock push notification
# 4. Verify reminder status in DynamoDB Admin
```

### View Logs

```bash
# Real-time logs via SST Console
npm run console

# Or via command line
npm run logs -- ApiStack/handleBatches

# Filter logs
npm run logs -- ApiStack/handleBatches --filter ERROR
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
docker-compose restart dynamodb

# Check logs
docker-compose logs dynamodb

# Nuclear option: recreate
docker-compose down
docker-compose up -d
```

### Lambda Function Not Updating

```bash
# SST may need restart
Ctrl+C
npm run dev

# Clear SST cache if still stuck
rm -rf .sst
npm run dev
```

### Can't Connect to Local Services

```bash
# Verify services are running
docker-compose ps

# Check endpoints
curl http://localhost:8000  # DynamoDB
curl http://localhost:8001  # DynamoDB Admin

# Check environment variables
echo $DYNAMODB_ENDPOINT
cat .env.local
```

### Cognito Tokens Expired

```bash
# Generate new token
tsx scripts/generate-test-token.ts

# Or extend token lifetime in Cognito console
# (not recommended for production)
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
tsx scripts/reset-local-db.ts --confirm
tsx scripts/seed-dev.ts --local
```

### 3. Monitor Logs Actively

```bash
# Keep SST Console open
open http://localhost:13557

# Watch for errors immediately
# Faster debugging
```

### 4. Use Mock Services

```bash
# Don't send real push notifications in dev
# Use mock-push.ts instead
# Saves costs and prevents spam
```

### 5. Commit Test Scripts

```bash
# Add your common test scenarios to git
# Share with team
# Document edge cases
```

## Performance Tips

### Fast Iteration

- Keep Docker services running (no restart needed)
- Use SST dev mode (hot reload)
- Attach debugger instead of console.log
- Use DynamoDB Admin UI instead of AWS CLI

### Reduce AWS Costs

- Use DynamoDB Local (not AWS)
- Keep S3 bucket small (lifecycle policies)
- Stay in free tier for Cognito (<50 users)
- Use CloudWatch free tier (5GB logs/month)

## Advanced Usage

### Running Multiple Environments

```bash
# Terminal 1: Local dev
STAGE=local npm run dev

# Terminal 2: Test with dev AWS
STAGE=dev npm run dev -- --port 3001

# Access different endpoints
curl localhost:3000/batches  # Local
curl localhost:3001/batches  # Dev AWS
```

### Custom Mock Implementations

Create your own mocks in `local/`:

```typescript
// local/mock-email.ts
export function sendEmail(to: string, subject: string, body: string) {
  console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
  // Store in DB for testing
}
```

### Integration with Backend

Backend Lambda functions automatically detect local mode:

```typescript
// In Lambda handler
const isLocal = process.env.IS_LOCAL === 'true';
const dynamoEndpoint = isLocal ? process.env.DYNAMODB_ENDPOINT : undefined;

const client = new DynamoDBClient({
  endpoint: dynamoEndpoint,
  region: 'us-east-1',
});
```

## Resources

- [SST Dev Mode Docs](https://docs.sst.dev/live-lambda-development)
- [DynamoDB Local Guide](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html)
- [Docker Compose Docs](https://docs.docker.com/compose/)
- [AWS CLI Reference](https://docs.aws.amazon.com/cli/)

## Getting Help

1. Check SST Console logs first
2. Verify Docker services are running
3. Check environment variables
4. Review this documentation
5. Ask team or open GitHub issue

---

**Pro Tip**: Bookmark this page and `http://localhost:13557` for quick access! 🚀

