# DynamoDB Single-Table Design

## Overview

The Kefir app uses a single-table design pattern for DynamoDB to optimize for access patterns and reduce cost.

## Table Configuration

- **Table Name**: `kefir-app-{stage}-table`
- **Partition Key**: `PK` (String)
- **Sort Key**: `SK` (String)
- **Billing Mode**: On-demand
- **Encryption**: AWS managed (default)

### Global Secondary Index (GSI1)
- **GSI Name**: `GSI1`
- **Partition Key**: `GSI1PK` (String)
- **Sort Key**: `GSI1SK` (String)
- **Projection**: ALL

## Entity Definitions

### 1. User

**Purpose**: Store user profile and settings

**Keys**:
```
PK: USER#<userId>
SK: METADATA
```

**Attributes**:
```typescript
{
  userId: string;
  email: string;
  name?: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
  preferences?: {
    notificationsEnabled: boolean;
    defaultTemperatureC: number;
  };
}
```

**Access Patterns**:
- Get user by ID: `PK = USER#<userId> AND SK = METADATA`

---

### 2. Batch

**Purpose**: Store kefir batch information

**Keys**:
```
PK: USER#<userId>
SK: BATCH#<batchId>
GSI1PK: BATCH#<batchId>
GSI1SK: STATUS#<status>#<createdAt>
```

**Attributes**:
```typescript
{
  batchId: string;
  userId: string;
  name: string;
  stage: 1 | 2;
  status: "active" | "in_fridge" | "ready" | "archived";
  
  // Stage 1 fields
  waterVolumeMl: number;
  sugarGrams: number;
  fruits?: string;
  temperatureC: number;
  startTime: string; // ISO 8601
  targetHoursStage1: number;
  
  // Stage 2 fields (optional)
  bottleCount?: number;
  bottleVolumeMl?: number;
  temperatureCStage2?: number;
  startTimeStage2?: string;
  targetHoursStage2?: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  
  // Public sharing
  isPublic?: boolean;
  publicNote?: string;
}
```

**Access Patterns**:
- Get all batches for user: `PK = USER#<userId> AND SK begins_with BATCH#`
- Get batch by ID: `GSI1PK = BATCH#<batchId>`
- Get batches by status: `GSI1PK begins_with BATCH# AND GSI1SK begins_with STATUS#<status>`

---

### 3. BatchEvent

**Purpose**: Track timeline events for a batch (photos, notes, stage transitions)

**Keys**:
```
PK: BATCH#<batchId>
SK: EVENT#<timestamp>#<eventId>
```

**Attributes**:
```typescript
{
  eventId: string;
  batchId: string;
  type: "photo" | "note" | "stage_transition" | "status_change";
  
  // Photo event
  photoUrl?: string;
  photoKey?: string;
  
  // Note event
  note?: string;
  
  // Transition event
  fromStage?: 1 | 2;
  toStage?: 1 | 2;
  fromStatus?: string;
  toStatus?: string;
  
  createdAt: string;
}
```

**Access Patterns**:
- Get events for batch (chronological): `PK = BATCH#<batchId> AND SK begins_with EVENT#`
- Get recent events: `PK = BATCH#<batchId> AND SK > EVENT#<timestamp>`

---

### 4. Reminder

**Purpose**: Store scheduled reminders for batches

**Keys**:
```
PK: BATCH#<batchId>
SK: REMINDER#<reminderId>
GSI1PK: USER#<userId>
GSI1SK: DUE#<dueAt>
```

**Attributes**:
```typescript
{
  reminderId: string;
  batchId: string;
  userId: string;
  message: string;
  dueAt: string; // ISO 8601
  status: "pending" | "sent" | "cancelled";
  
  // EventBridge integration
  schedulerArn?: string;
  
  createdAt: string;
  sentAt?: string;
  cancelledAt?: string;
}
```

**Access Patterns**:
- Get reminders for batch: `PK = BATCH#<batchId> AND SK begins_with REMINDER#`
- Get user's upcoming reminders: `GSI1PK = USER#<userId> AND GSI1SK begins_with DUE# AND GSI1SK > DUE#<now>`
- Get due reminders: `GSI1SK < DUE#<now>` (scan or query all users)

---

### 5. Device

**Purpose**: Store registered devices for push notifications

**Keys**:
```
PK: USER#<userId>
SK: DEVICE#<deviceId>
```

**Attributes**:
```typescript
{
  deviceId: string;
  userId: string;
  platform: "ios" | "android" | "web";
  pushToken: string; // Expo push token
  
  deviceInfo?: {
    model?: string;
    osVersion?: string;
    appVersion?: string;
  };
  
  createdAt: string;
  lastSeenAt: string;
}
```

**Access Patterns**:
- Get devices for user: `PK = USER#<userId> AND SK begins_with DEVICE#`
- Get specific device: `PK = USER#<userId> AND SK = DEVICE#<deviceId>`

---

## Access Pattern Examples

### 1. List User's Active Batches

```typescript
// Query main table
const params = {
  TableName: tableName,
  KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
  FilterExpression: "#status = :status",
  ExpressionAttributeNames: {
    "#status": "status",
  },
  ExpressionAttributeValues: {
    ":pk": "USER#123",
    ":sk": "BATCH#",
    ":status": "active",
  },
};
```

### 2. Get Batch with Events and Reminders

```typescript
// Query 1: Get batch
const batchParams = {
  TableName: tableName,
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :pk",
  ExpressionAttributeValues: {
    ":pk": "BATCH#abc",
  },
};

// Query 2: Get events
const eventsParams = {
  TableName: tableName,
  KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
  ExpressionAttributeValues: {
    ":pk": "BATCH#abc",
    ":sk": "EVENT#",
  },
  ScanIndexForward: false, // Newest first
  Limit: 20,
};

// Query 3: Get reminders
const remindersParams = {
  TableName: tableName,
  KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
  ExpressionAttributeValues: {
    ":pk": "BATCH#abc",
    ":sk": "REMINDER#",
  },
};
```

### 3. Get User's Upcoming Reminders

```typescript
const params = {
  TableName: tableName,
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :pk AND GSI1SK BETWEEN :start AND :end",
  ExpressionAttributeValues: {
    ":pk": "USER#123",
    ":start": `DUE#${new Date().toISOString()}`,
    ":end": `DUE#${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()}`,
  },
};
```

### 4. Export All User Data (CSV)

```typescript
// Query all items for user
const params = {
  TableName: tableName,
  KeyConditionExpression: "PK = :pk",
  ExpressionAttributeValues: {
    ":pk": "USER#123",
  },
};

// Results include:
// - User metadata
// - All batches
// - All devices

// Then query each batch for events and reminders
```

## Capacity Planning

### Estimated Item Sizes

| Entity | Size (KB) | Notes |
|--------|-----------|-------|
| User | 1 | Minimal metadata |
| Batch | 2 | Stage 1 + 2 data |
| Event | 1-3 | Depends on note length |
| Reminder | 1 | Simple reminder data |
| Device | 1 | Push token + metadata |

### Estimated Storage (Per User)

- 1 User = 1 KB
- 10 Batches = 20 KB
- 50 Events = 100 KB
- 20 Reminders = 20 KB
- 3 Devices = 3 KB
- **Total**: ~150 KB per active user

### Cost Estimate (On-Demand)

For 1,000 users with 10 batches each:
- Storage: 150 MB = $0.04/month
- Reads: 100K requests = $0.025/month
- Writes: 50K requests = $0.06/month
- **Total**: ~$0.125/month

## Best Practices

### 1. Use Composite Keys
Always combine multiple attributes in sort keys for flexible querying:
```
SK: EVENT#2024-01-15T10:30:00Z#evt123
```

### 2. Optimize for Read Patterns
Design keys based on how data will be queried, not how it's structured logically.

### 3. Use Sparse Indexes
Only add GSI attributes when needed (e.g., reminders have GSI1 for user queries).

### 4. Batch Operations
Use BatchGetItem and BatchWriteItem for multiple items.

### 5. Time-Based Partitioning
Include timestamps in sort keys for chronological queries.

### 6. Avoid Hot Partitions
Distribute writes across multiple partition keys (already done per-user).

## Migration Strategy

### Adding New Attributes
1. Add attribute to type definition
2. Update Lambda functions
3. Deploy with backward compatibility
4. Old items work without migration

### Changing Access Patterns
1. Add new GSI if needed
2. Backfill GSI attributes (script)
3. Update queries to use new index
4. Remove old GSI after validation

### Schema Evolution
- Use optional attributes for new fields
- Version entities if breaking changes needed
- Keep migration scripts in `scripts/migrations/`

## Testing

### Local Development
Use DynamoDB Local or SST's built-in dev mode.

### Seed Data
Run `tsx scripts/seed-dev.ts` to populate test data.

### Access Pattern Testing
Create unit tests for each query pattern:
```typescript
describe("Batch Access Patterns", () => {
  test("Get all user batches", async () => {
    const result = await getUserBatches("USER#123");
    expect(result.length).toBeGreaterThan(0);
  });
});
```

