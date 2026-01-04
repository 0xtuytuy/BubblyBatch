# Local Development

This directory contains utilities for local development and testing.

## Files

- `mock-services.ts` - In-memory implementations of AWS services (DynamoDB, S3, EventBridge)
- `test-data.ts` - Seed data for local testing

## Usage

### Running Locally with Serverless Offline

```bash
npm run dev
```

This will start the API locally on `http://localhost:3000` using Serverless Offline.

### Testing with Mock Data

The mock services provide in-memory storage for:
- **DynamoDB**: All database operations
- **S3**: Photo storage (returns mock presigned URLs)
- **EventBridge Scheduler**: Reminder scheduling

### Seed Test Data

When running locally, you can seed the database with test data:

```typescript
import { seedTestData } from './local/test-data';

seedTestData();
```

This creates:
- 2 test users (alice@example.com, bob@example.com)
- 3 test batches
- Sample events for each batch
- 1 test device

### Testing API Endpoints

With the local server running, you can test endpoints using curl or Postman:

```bash
# Health check (no auth required)
curl http://localhost:3000/public/b/batch-1

# List batches (requires JWT token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/batches

# Create a batch
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Batch","stage":"stage1_open"}' \
  http://localhost:3000/batches
```

### JWT Token for Local Testing

For local development, you'll need a valid JWT token from Cognito. You can:

1. Deploy only the Cognito stack to AWS
2. Use the Cognito authentication flow to get a token
3. Or temporarily bypass auth by modifying the handler to extract userId from a custom header

### Mock Service Utilities

```typescript
import { mockDynamoDB, mockS3, mockScheduler, clearAllMockStorage, getMockStorageStats } from './local/mock-services';

// Clear all storage
clearAllMockStorage();

// Get statistics
const stats = getMockStorageStats();
console.log(stats); // { dynamodb: 10, s3: 5, scheduler: 2 }

// Direct access to storage
mockDynamoDB.size();
mockS3.size();
mockScheduler.size();
```

## Environment Variables for Local Development

When running locally, make sure these environment variables are set:

```bash
TABLE_NAME=kefir-table-local
BUCKET_NAME=kefir-photos-local
USER_POOL_ID=local
USER_POOL_CLIENT_ID=local
SCHEDULER_GROUP_NAME=kefir-reminders-local
STAGE=local
```

These are automatically configured by Serverless Offline.

