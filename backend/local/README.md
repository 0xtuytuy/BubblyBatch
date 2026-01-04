# Local Development

This directory contains utilities for local development.

## Quick Start

```bash
# 1. Start Docker containers (DynamoDB Local)
npm run local:docker

# 2. Setup tables
npm run local:setup

# 3. Seed test data
npm run local:seed

# 4. Start local server
npm run dev
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run local:docker` | Start DynamoDB Local in Docker |
| `npm run local:setup` | Create DynamoDB tables |
| `npm run local:seed` | Seed test data to local DynamoDB |
| `npm run local:clean` | Clear all data from local DynamoDB |
| `npm run local:reset` | Reset tables (interactive prompt) |
| `npm run dev` | Start Serverless Offline |

## Test Data

After seeding, the following test data is available:

**Test User:**
- Email: `test@example.com`
- User ID: `test123`

**Sample Batches:**
- `batch001`: Summer Lemon Kefir (active)
- `batch002`: Berry Blast (in fridge)

## Testing API Endpoints

With the local server running, you can test endpoints using curl:

```bash
# List batches (requires X-User-Id header)
curl -H "X-User-Id: test123" http://localhost:3000/batches

# Get public batch (no auth)
curl http://localhost:3000/public/b/batch001

# Create a batch
curl -X POST \
  -H "X-User-Id: test123" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Batch","stage":1}' \
  http://localhost:3000/batches
```

## Admin Interfaces

- **DynamoDB Admin UI**: http://localhost:8001
- **API Endpoint**: http://localhost:3000

## Environment Variables

These are automatically set by `start-local.sh`:

```bash
TABLE_NAME=kefir-local-table
BUCKET_NAME=kefir-photos-local
USER_POOL_ID=local-pool
USER_POOL_CLIENT_ID=local-client
SCHEDULER_GROUP_NAME=kefir-reminders-local
STAGE=local
DYNAMODB_ENDPOINT=http://localhost:8000
```
