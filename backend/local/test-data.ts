/**
 * Seed data for local development and testing
 */

import { mockDynamoDB } from './mock-services';

export interface TestUser {
  userId: string;
  email: string;
  name?: string;
}

export interface TestBatch {
  batchId: string;
  userId: string;
  name: string;
  stage: string;
  status: string;
}

export const testUsers: TestUser[] = [
  {
    userId: 'test-user-1',
    email: 'alice@example.com',
    name: 'Alice Smith',
  },
  {
    userId: 'test-user-2',
    email: 'bob@example.com',
    name: 'Bob Jones',
  },
];

export const testBatches: TestBatch[] = [
  {
    batchId: 'batch-1',
    userId: 'test-user-1',
    name: 'Strawberry Kefir',
    stage: 'stage1_open',
    status: 'active',
  },
  {
    batchId: 'batch-2',
    userId: 'test-user-1',
    name: 'Plain Kefir',
    stage: 'stage2_bottled',
    status: 'in_fridge',
  },
  {
    batchId: 'batch-3',
    userId: 'test-user-2',
    name: 'Blueberry Kefir',
    stage: 'stage1_open',
    status: 'active',
  },
];

/**
 * Seed the mock database with test data
 */
export function seedTestData() {
  console.log('[TestData] Seeding database...');

  const now = new Date().toISOString();

  // Seed users
  for (const user of testUsers) {
    mockDynamoDB.put('kefir-table-local', {
      PK: `USER#${user.userId}`,
      SK: `USER#${user.userId}`,
      userId: user.userId,
      email: user.email,
      name: user.name,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Seed batches
  for (const batch of testBatches) {
    mockDynamoDB.put('kefir-table-local', {
      PK: `USER#${batch.userId}`,
      SK: `BATCH#${batch.batchId}`,
      GSI1PK: `BATCH#${batch.batchId}`,
      GSI1SK: `USER#${batch.userId}`,
      batchId: batch.batchId,
      userId: batch.userId,
      name: batch.name,
      stage: batch.stage,
      status: batch.status,
      startDate: now,
      isPublic: false,
      photoKeys: [],
      createdAt: now,
      updatedAt: now,
    });

    // Add a sample event for each batch
    mockDynamoDB.put('kefir-table-local', {
      PK: `BATCH#${batch.batchId}`,
      SK: `EVENT#${now}`,
      eventId: `event-${batch.batchId}-1`,
      batchId: batch.batchId,
      userId: batch.userId,
      type: 'note',
      timestamp: now,
      description: 'Batch started',
      createdAt: now,
    });
  }

  // Seed a test device
  mockDynamoDB.put('kefir-table-local', {
    PK: `USER#test-user-1`,
    SK: `DEVICE#device-1`,
    deviceId: 'device-1',
    userId: 'test-user-1',
    platform: 'ios',
    token: 'mock-fcm-token-123',
    deviceName: 'iPhone 15 Pro',
    appVersion: '1.0.0',
    lastActiveAt: now,
    createdAt: now,
    updatedAt: now,
  });

  console.log(`[TestData] Seeded ${testUsers.length} users`);
  console.log(`[TestData] Seeded ${testBatches.length} batches`);
  console.log(`[TestData] Seeded ${testBatches.length} events`);
  console.log(`[TestData] Seeded 1 device`);
  console.log('[TestData] Database ready for testing');
}

/**
 * Print current database contents
 */
export function printTestData() {
  console.log('\n=== Mock Database Contents ===');
  console.log('Users:', testUsers.length);
  console.log('Batches:', testBatches.length);
  console.log('==============================\n');
}

