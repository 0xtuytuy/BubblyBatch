# Backend Development Rules

> Guidelines for working with the Serverless backend (AWS Lambda functions)

## 🏗️ Architecture Pattern

### Handler → Service → Data Layer

The backend follows a clean three-layer architecture:

```
Handler (handler.ts)
    ↓ validates input, extracts user context
Service (service.ts)
    ↓ business logic, orchestration
Data Layer (lib/db.ts, lib/s3.ts)
    ↓ AWS SDK calls
```

**Example from `backend/src/functions/batch/handler.ts`:**
```typescript
export async function main(event: APIGatewayProxyEventV2) {
  const { userId } = getUserContext(event);     // Extract auth
  const input = parseBody(event, CreateBatchSchema);  // Validate
  const batch = await batchService.createBatch(userId, input);  // Business logic
  return created({ batch });  // Response helper
}
```

### File Structure per Function

```
backend/src/functions/
└── {feature}/
    ├── handler.ts    # API Gateway event handler, routing, validation
    └── service.ts    # Business logic, orchestration
```

## ✅ Input Validation with Zod

### Schema Definition Pattern

Define schemas in `backend/src/models/{entity}.ts`:

```typescript
import { z } from 'zod';

// Full entity schema (with DynamoDB keys)
export const BatchSchema = z.object({
  PK: z.string(),
  SK: z.string(),
  GSI1PK: z.string(),
  GSI1SK: z.string(),
  batchId: z.string(),
  userId: z.string(),
  name: z.string(),
  // ... more fields
});

// Create input schema (user-provided fields only)
export const CreateBatchSchema = z.object({
  name: z.string().min(1).max(100),
  stage: z.enum(['stage1_open', 'stage2_bottled']),
  targetDuration: z.number().min(1).max(720).optional(),
  // ... more fields
});

// Update input schema (all fields optional)
export const UpdateBatchSchema = CreateBatchSchema.partial();

// Filter schema for query params
export const BatchFiltersSchema = z.object({
  stage: z.enum(['stage1_open', 'stage2_bottled']).optional(),
  status: z.enum(['active', 'in_fridge', 'ready', 'archived']).optional(),
  limit: z.number().min(1).max(100).default(50).optional(),
});

// Export inferred types
export type Batch = z.infer<typeof BatchSchema>;
export type CreateBatchInput = z.infer<typeof CreateBatchSchema>;
```

### Using Validation Helpers

Use the helpers from `backend/src/utils/validation.ts`:

```typescript
import { parseBody, parseQuery, getPathParam } from '../../utils/validation';

// Parse and validate JSON body
const input = parseBody(event, CreateBatchSchema);

// Parse and validate query parameters
const filters = parseQuery(event, BatchFiltersSchema);

// Extract path parameter
const batchId = getPathParam(event, 'id');
```

These helpers automatically:
- Parse the input
- Validate against schema
- Throw `ValidationError` with formatted messages on failure

## 📦 Response Utilities

Use standardized response helpers from `backend/src/utils/response.ts`:

```typescript
import { success, created, notFound, badRequest, error } from '../../utils/response';

// 200 OK with data
return success({ batch });
return success({ batches, count: batches.length });

// 201 Created
return created({ batch });

// 404 Not Found
return notFound('Batch not found');

// 400 Bad Request
return badRequest('Invalid batch ID');

// 500 Internal Server Error
return error('Internal server error', 500);
```

**Do not** manually construct response objects. Always use these helpers.

## 🗄️ DynamoDB Single-Table Design

### Key Pattern

All entities share one table using PK/SK patterns defined in `backend/src/lib/db.ts`:

```typescript
import { keys } from '../../lib/db';

// User keys
keys.user(userId)
// → { PK: 'USER#123', SK: 'USER#123' }

// Batch keys
keys.batch(userId, batchId)
// → { PK: 'USER#123', SK: 'BATCH#abc', GSI1PK: 'BATCH#abc', GSI1SK: 'USER#123' }

// Event keys
keys.event(batchId, timestamp)
// → { PK: 'BATCH#abc', SK: 'EVENT#2024-01-01T12:00:00Z' }

// Reminder keys
keys.reminder(userId, reminderId)
// → { PK: 'USER#123', SK: 'REMINDER#xyz' }

// Device keys
keys.device(userId, deviceId)
// → { PK: 'USER#123', SK: 'DEVICE#device1' }
```

### Access Patterns

| Pattern | Method | Example |
|---------|--------|---------|
| Get user's batches | `db.query()` | `PK = USER#123, SK begins_with BATCH#` |
| Get batch by ID | `db.queryGSI1()` | `GSI1PK = BATCH#abc` |
| Get batch events | `db.query()` | `PK = BATCH#abc, SK begins_with EVENT#` |
| Get user reminders | `db.query()` | `PK = USER#123, SK begins_with REMINDER#` |

### Database Operations

Use the db helper functions from `backend/src/lib/db.ts`:

```typescript
import { db, keys, entities } from '../../lib/db';

// Create/update item
await db.put({
  ...keys.batch(userId, batchId),
  batchId,
  userId,
  name: 'Lemon Kefir',
  status: 'active',
  createdAt: new Date().toISOString(),
});

// Get single item
const batch = await db.get(PK, SK);

// Query with prefix
const batches = await db.query({
  PK: `USER#${userId}`,
  SK: { beginsWith: 'BATCH#' },
  limit: 50,
  sortAscending: false,  // Most recent first
});

// Query with GSI
const batch = await db.queryGSI1({
  GSI1PK: `BATCH#${batchId}`,
  limit: 1,
});

// Update specific fields
await db.update({
  PK: `USER#${userId}`,
  SK: `BATCH#${batchId}`,
  updates: { status: 'completed', notes: 'Tastes great!' },
});

// Delete item
await db.delete(PK, SK);
```

### Higher-Level Entity Operations

Use entity helpers for common patterns:

```typescript
import { entities } from '../../lib/db';

// Get or create user (idempotent)
const user = await entities.getOrCreateUser(userId, email);

// Get all user batches
const batches = await entities.getUserBatches(userId, limit);

// Get batch by ID (any user)
const batch = await entities.getBatchById(batchId);

// Get batch events
const events = await entities.getBatchEvents(batchId, limit);

// Get user reminders
const reminders = await entities.getUserReminders(userId);

// Get user devices
const devices = await entities.getUserDevices(userId);
```

## 🔐 Authentication & Authorization

### Extracting User Context

```typescript
import { getUserContext } from '../../lib/auth';

const { userId, email } = getUserContext(event);
```

This extracts the Cognito user ID from the JWT token in the Authorization header.

### Authorization Pattern

Always verify ownership before modifying resources:

```typescript
// Get the batch
const batch = await batchService.getBatch(batchId, userId);

// If batch doesn't belong to user, getBatch will throw NotFoundError
// This prevents unauthorized access without exposing existence
```

**Security Rule:** Never confirm existence of resources the user doesn't own.

## ☁️ AWS SDK v3 Usage

### Import Pattern

Use modular imports for tree-shaking:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { SchedulerClient, CreateScheduleCommand } from '@aws-sdk/client-scheduler';
```

### Client Configuration

Clients are configured once and reused (see `backend/src/lib/`):

```typescript
// DynamoDB Document Client with marshall options
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,  // Clean up undefined values
    convertEmptyValues: false,    // Don't convert empty strings to null
  },
});
```

## 📸 S3 Photo Upload Pattern

### Two-Step Upload Process

1. **Get presigned URL** (POST `/batches/:id/photo/upload-url`)
```typescript
// Generate presigned URL (5 min expiration)
const uploadUrl = await s3Helper.getPresignedUploadUrl(key, contentType);
return success({ uploadUrl, photoKey: key });
```

2. **Confirm upload** (POST `/batches/:id/photo`)
```typescript
// Add photo key to batch
const batch = await batchService.addPhotoToBatch(batchId, userId, photoKey);
return success({ batch });
```

**Why two steps?**
- Frontend uploads directly to S3 (no Lambda bottleneck)
- Lambda only generates URL and updates metadata
- Better performance and lower cost

## ⚠️ Error Handling

### Standard Pattern

```typescript
import { handleError } from '../../utils/errors';
import { ValidationError } from '../../utils/validation';

try {
  // Your logic here
} catch (err: any) {
  console.error('Error:', err);
  
  // Handle validation errors specially
  if (err instanceof ValidationError) {
    return badRequest(JSON.stringify(formatValidationErrors(err.errors)));
  }
  
  // Generic error handler
  const { statusCode, message } = handleError(err);
  return error(message, statusCode);
}
```

### Custom Error Types

Define custom errors in `backend/src/utils/errors.ts`:

```typescript
export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends Error {
  statusCode = 403;
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}
```

## 🔄 Service Layer Pattern

### Service Class Structure

```typescript
// backend/src/functions/batch/service.ts
export class BatchService {
  /**
   * Create a new batch for a user
   */
  async createBatch(userId: string, input: CreateBatchInput): Promise<Batch> {
    const batchId = generateId();
    const now = new Date().toISOString();
    
    const batch = {
      ...keys.batch(userId, batchId),
      batchId,
      userId,
      ...input,
      status: BatchStatus.ACTIVE,
      photoKeys: [],
      createdAt: now,
      updatedAt: now,
    };
    
    await db.put(batch);
    return batch;
  }
  
  /**
   * Get batch by ID, ensuring user owns it
   */
  async getBatch(batchId: string, userId: string): Promise<Batch> {
    const batch = await db.get(`USER#${userId}`, `BATCH#${batchId}`);
    
    if (!batch) {
      throw new NotFoundError('Batch not found');
    }
    
    return batch;
  }
  
  // More methods...
}
```

**Service Responsibilities:**
- Business logic and orchestration
- Data validation (Zod handles input, service handles business rules)
- Calling multiple data operations
- Throwing appropriate errors
- Generating IDs, timestamps, defaults

**Service Should NOT:**
- Parse HTTP requests (handler's job)
- Build HTTP responses (handler's job)
- Know about API Gateway events

## 📝 Code Documentation

### JSDoc for Public Methods

```typescript
/**
 * Update an existing batch with new values
 * 
 * @param batchId - Unique identifier of the batch
 * @param userId - ID of the user who owns the batch
 * @param updates - Partial batch data to update
 * @returns The updated batch
 * @throws {NotFoundError} If batch doesn't exist or doesn't belong to user
 */
async updateBatch(
  batchId: string,
  userId: string,
  updates: UpdateBatchInput
): Promise<Batch> {
  // Implementation
}
```

### Inline Comments for Complex Logic

```typescript
// Query batches in reverse chronological order
// This ensures the most recent batches appear first in the UI
const batches = await db.query({
  PK: `USER#${userId}`,
  SK: { beginsWith: 'BATCH#' },
  sortAscending: false,  // Most recent first
});
```

## 🧪 Testing Approach (Future)

When tests are implemented, follow these patterns:

```typescript
describe('BatchService', () => {
  describe('createBatch', () => {
    it('should create a batch with valid input', async () => {
      const input = { name: 'Test Batch', stage: 'stage1_open' };
      const batch = await batchService.createBatch('user123', input);
      
      expect(batch.name).toBe('Test Batch');
      expect(batch.userId).toBe('user123');
      expect(batch.batchId).toBeDefined();
    });
    
    it('should throw ValidationError for invalid input', async () => {
      const input = { name: '', stage: 'invalid' };
      await expect(
        batchService.createBatch('user123', input)
      ).rejects.toThrow(ValidationError);
    });
  });
});
```

## 🚀 Deployment Configuration

### Serverless Framework

Lambda functions are configured in `backend/serverless.yml`:

```yaml
functions:
  handleBatches:
    handler: src/functions/batch/handler.main
    events:
      - httpApi:
          method: POST
          path: /batches
          authorizer:
            name: cognitoAuthorizer
      - httpApi:
          method: GET
          path: /batches
          authorizer:
            name: cognitoAuthorizer
```

### Environment Variables

Access via `process.env`:

```typescript
const TABLE_NAME = process.env.TABLE_NAME!;
const BUCKET_NAME = process.env.BUCKET_NAME!;
const USER_POOL_ID = process.env.USER_POOL_ID!;
const STAGE = process.env.STAGE!;  // 'dev' | 'prod'
```

## ⚡ Performance Best Practices

1. **Reuse AWS clients** - Create once, use many times
2. **Use single-table design** - Minimize cross-table joins
3. **Query efficiently** - Use PK/SK patterns, avoid scans
4. **Batch operations** - Use `batchGet` and `batchWrite` when possible
5. **Limit results** - Always specify reasonable limits on queries
6. **Index wisely** - Use GSI1 for alternate access patterns

## 🔒 Security Checklist

- ✅ Validate all inputs with Zod schemas
- ✅ Verify user ownership before returning data
- ✅ Use IAM least privilege (defined in infra)
- ✅ Don't log sensitive data (tokens, passwords, PII)
- ✅ Sanitize error messages for production
- ✅ Use presigned URLs with short expiration (5 min)
- ✅ Enable CloudWatch logging for all functions

---

**Remember:** The backend is the source of truth. Never trust client-side validation alone. Always validate on the server.

