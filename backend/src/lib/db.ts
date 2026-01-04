import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  BatchGetCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';

const IS_OFFLINE = process.env.IS_OFFLINE === 'true';
const TABLE_NAME = process.env.TABLE_NAME!;

// In-memory storage for offline mode
const offlineStorage = new Map<string, any>();

// Initialize DynamoDB client (only used in online mode)
const client = IS_OFFLINE ? null : new DynamoDBClient({});
const docClient = IS_OFFLINE ? null : DynamoDBDocumentClient.from(client!, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
});

// Key builders for single-table design
export const keys = {
  user: (userId: string) => ({
    PK: `USER#${userId}`,
    SK: `USER#${userId}`,
  }),
  batch: (userId: string, batchId: string) => ({
    PK: `USER#${userId}`,
    SK: `BATCH#${batchId}`,
    GSI1PK: `BATCH#${batchId}`,
    GSI1SK: `USER#${userId}`,
  }),
  event: (batchId: string, timestamp: string) => ({
    PK: `BATCH#${batchId}`,
    SK: `EVENT#${timestamp}`,
  }),
  reminder: (userId: string, reminderId: string) => ({
    PK: `USER#${userId}`,
    SK: `REMINDER#${reminderId}`,
  }),
  device: (userId: string, deviceId: string) => ({
    PK: `USER#${userId}`,
    SK: `DEVICE#${deviceId}`,
  }),
};

// Base CRUD operations
export const db = {
  /**
   * Put an item into DynamoDB (or offline storage)
   */
  async put(item: Record<string, any>): Promise<void> {
    const itemWithTimestamp = {
      ...item,
      updatedAt: new Date().toISOString(),
    };

    if (IS_OFFLINE) {
      const key = `${item.PK}#${item.SK}`;
      offlineStorage.set(key, itemWithTimestamp);
      console.log(`[OFFLINE DB] PUT ${key}`);
      return;
    }

    await docClient!.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: itemWithTimestamp,
      })
    );
  },

  /**
   * Get a single item by PK and SK
   */
  async get(PK: string, SK: string): Promise<Record<string, any> | null> {
    if (IS_OFFLINE) {
      const key = `${PK}#${SK}`;
      const item = offlineStorage.get(key);
      console.log(`[OFFLINE DB] GET ${key} - ${item ? 'found' : 'not found'}`);
      return item || null;
    }

    const result = await docClient!.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK, SK },
      })
    );
    return result.Item || null;
  },

  /**
   * Query items by PK with optional SK condition
   */
  async query(params: {
    PK: string;
    SK?: {
      beginsWith?: string;
      equals?: string;
      between?: [string, string];
    };
    limit?: number;
    sortAscending?: boolean;
  }): Promise<Record<string, any>[]> {
    if (IS_OFFLINE) {
      const items: any[] = [];
      for (const [key, value] of offlineStorage.entries()) {
        if (key.startsWith(params.PK)) {
          if (!params.SK || 
              (params.SK.beginsWith && value.SK.startsWith(params.SK.beginsWith)) ||
              (params.SK.equals && value.SK === params.SK.equals) ||
              (params.SK.between && value.SK >= params.SK.between[0] && value.SK <= params.SK.between[1])) {
            items.push(value);
          }
        }
      }
      
      // Sort by SK
      items.sort((a, b) => {
        const order = params.sortAscending ? 1 : -1;
        return a.SK < b.SK ? -order : order;
      });
      
      const limited = params.limit ? items.slice(0, params.limit) : items;
      console.log(`[OFFLINE DB] QUERY ${params.PK} - found ${limited.length} items`);
      return limited;
    }

    let KeyConditionExpression = 'PK = :pk';
    const ExpressionAttributeValues: Record<string, any> = {
      ':pk': params.PK,
    };

    if (params.SK) {
      if (params.SK.beginsWith) {
        KeyConditionExpression += ' AND begins_with(SK, :sk)';
        ExpressionAttributeValues[':sk'] = params.SK.beginsWith;
      } else if (params.SK.equals) {
        KeyConditionExpression += ' AND SK = :sk';
        ExpressionAttributeValues[':sk'] = params.SK.equals;
      } else if (params.SK.between) {
        KeyConditionExpression += ' AND SK BETWEEN :sk1 AND :sk2';
        ExpressionAttributeValues[':sk1'] = params.SK.between[0];
        ExpressionAttributeValues[':sk2'] = params.SK.between[1];
      }
    }

    const result = await docClient!.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression,
        ExpressionAttributeValues,
        Limit: params.limit,
        ScanIndexForward: params.sortAscending ?? true,
      })
    );

    return result.Items || [];
  },

  /**
   * Query using GSI1
   */
  async queryGSI1(params: {
    GSI1PK: string;
    GSI1SK?: {
      beginsWith?: string;
      equals?: string;
    };
    limit?: number;
  }): Promise<Record<string, any>[]> {
    if (IS_OFFLINE) {
      const items: any[] = [];
      for (const [_, value] of offlineStorage.entries()) {
        if (value.GSI1PK === params.GSI1PK) {
          if (!params.GSI1SK ||
              (params.GSI1SK.beginsWith && value.GSI1SK?.startsWith(params.GSI1SK.beginsWith)) ||
              (params.GSI1SK.equals && value.GSI1SK === params.GSI1SK.equals)) {
            items.push(value);
          }
        }
      }
      const limited = params.limit ? items.slice(0, params.limit) : items;
      console.log(`[OFFLINE DB] QUERY GSI1 ${params.GSI1PK} - found ${limited.length} items`);
      return limited;
    }

    let KeyConditionExpression = 'GSI1PK = :gsi1pk';
    const ExpressionAttributeValues: Record<string, any> = {
      ':gsi1pk': params.GSI1PK,
    };

    if (params.GSI1SK) {
      if (params.GSI1SK.beginsWith) {
        KeyConditionExpression += ' AND begins_with(GSI1SK, :gsi1sk)';
        ExpressionAttributeValues[':gsi1sk'] = params.GSI1SK.beginsWith;
      } else if (params.GSI1SK.equals) {
        KeyConditionExpression += ' AND GSI1SK = :gsi1sk';
        ExpressionAttributeValues[':gsi1sk'] = params.GSI1SK.equals;
      }
    }

    const result = await docClient!.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: 'GSI1',
        KeyConditionExpression,
        ExpressionAttributeValues,
        Limit: params.limit,
      })
    );

    return result.Items || [];
  },

  /**
   * Update an item with specific attributes
   */
  async update(params: {
    PK: string;
    SK: string;
    updates: Record<string, any>;
  }): Promise<Record<string, any>> {
    if (IS_OFFLINE) {
      const key = `${params.PK}#${params.SK}`;
      const existing = offlineStorage.get(key);
      if (!existing) {
        console.log(`[OFFLINE DB] UPDATE ${key} - not found`);
        return {};
      }
      const updated = {
        ...existing,
        ...params.updates,
        updatedAt: new Date().toISOString(),
      };
      offlineStorage.set(key, updated);
      console.log(`[OFFLINE DB] UPDATE ${key}`);
      return updated;
    }

    const updateExpressions: string[] = [];
    const ExpressionAttributeNames: Record<string, string> = {};
    const ExpressionAttributeValues: Record<string, any> = {};

    Object.entries(params.updates).forEach(([key, value], index) => {
      const nameKey = `#field${index}`;
      const valueKey = `:value${index}`;
      updateExpressions.push(`${nameKey} = ${valueKey}`);
      ExpressionAttributeNames[nameKey] = key;
      ExpressionAttributeValues[valueKey] = value;
    });

    // Always update the updatedAt timestamp
    updateExpressions.push('#updatedAt = :updatedAt');
    ExpressionAttributeNames['#updatedAt'] = 'updatedAt';
    ExpressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await docClient!.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: params.PK, SK: params.SK },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return result.Attributes || {};
  },

  /**
   * Delete an item
   */
  async delete(PK: string, SK: string): Promise<void> {
    if (IS_OFFLINE) {
      const key = `${PK}#${SK}`;
      const deleted = offlineStorage.delete(key);
      console.log(`[OFFLINE DB] DELETE ${key} - ${deleted ? 'success' : 'not found'}`);
      return;
    }

    await docClient!.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK, SK },
      })
    );
  },

  /**
   * Batch get multiple items
   */
  async batchGet(keys: Array<{ PK: string; SK: string }>): Promise<Record<string, any>[]> {
    if (keys.length === 0) return [];

    if (IS_OFFLINE) {
      const items = keys.map(({ PK, SK }) => offlineStorage.get(`${PK}#${SK}`)).filter(Boolean);
      console.log(`[OFFLINE DB] BATCH GET ${keys.length} keys - found ${items.length} items`);
      return items;
    }

    const result = await docClient!.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLE_NAME]: {
            Keys: keys,
          },
        },
      })
    );

    return result.Responses?.[TABLE_NAME] || [];
  },

  /**
   * Batch write (put or delete) multiple items
   */
  async batchWrite(operations: Array<{ put?: Record<string, any>; delete?: { PK: string; SK: string } }>): Promise<void> {
    if (operations.length === 0) return;

    if (IS_OFFLINE) {
      for (const op of operations) {
        if (op.put) {
          const key = `${op.put.PK}#${op.put.SK}`;
          offlineStorage.set(key, { ...op.put, updatedAt: new Date().toISOString() });
        } else if (op.delete) {
          const key = `${op.delete.PK}#${op.delete.SK}`;
          offlineStorage.delete(key);
        }
      }
      console.log(`[OFFLINE DB] BATCH WRITE ${operations.length} operations`);
      return;
    }

    const requests = operations.map((op) => {
      if (op.put) {
        return {
          PutRequest: {
            Item: {
              ...op.put,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      } else if (op.delete) {
        return {
          DeleteRequest: {
            Key: op.delete,
          },
        };
      }
      throw new Error('Invalid batch operation');
    });

    await docClient!.send(
      new BatchWriteCommand({
        RequestItems: {
          [TABLE_NAME]: requests,
        },
      })
    );
  },
};

/**
 * Seed offline storage with test data
 * Only used in offline mode
 */
export function seedOfflineData() {
  if (!IS_OFFLINE) return;

  console.log('[OFFLINE DB] Seeding test data...');
  
  const now = new Date().toISOString();
  
  // Seed test users
  const testUsers = [
    { userId: 'test-user-1', email: 'alice@example.com', name: 'Alice Smith' },
    { userId: 'test-user-2', email: 'bob@example.com', name: 'Bob Jones' },
  ];
  
  for (const user of testUsers) {
    const userKeys = keys.user(user.userId);
    offlineStorage.set(`${userKeys.PK}#${userKeys.SK}`, {
      ...userKeys,
      ...user,
      createdAt: now,
      updatedAt: now,
    });
  }
  
  // Seed test batches
  const testBatches = [
    { batchId: 'batch-1', userId: 'test-user-1', name: 'Strawberry Kefir', stage: 'stage1_open', status: 'active' },
    { batchId: 'batch-2', userId: 'test-user-1', name: 'Plain Kefir', stage: 'stage2_bottled', status: 'in_fridge' },
    { batchId: 'batch-3', userId: 'test-user-2', name: 'Blueberry Kefir', stage: 'stage1_open', status: 'active' },
  ];
  
  for (const batch of testBatches) {
    const batchKeys = keys.batch(batch.userId, batch.batchId);
    offlineStorage.set(`${batchKeys.PK}#${batchKeys.SK}`, {
      ...batchKeys,
      ...batch,
      startDate: now,
      isPublic: false,
      photoKeys: [],
      createdAt: now,
      updatedAt: now,
    });
    
    // Add sample event
    const eventKeys = keys.event(batch.batchId, now);
    offlineStorage.set(`${eventKeys.PK}#${eventKeys.SK}`, {
      ...eventKeys,
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
  const deviceKeys = keys.device('test-user-1', 'device-1');
  offlineStorage.set(`${deviceKeys.PK}#${deviceKeys.SK}`, {
    ...deviceKeys,
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
  
  console.log(`[OFFLINE DB] Seeded ${testUsers.length} users, ${testBatches.length} batches, ${testBatches.length} events, 1 device`);
}

/**
 * Clear offline storage
 */
export function clearOfflineData() {
  if (!IS_OFFLINE) return;
  offlineStorage.clear();
  console.log('[OFFLINE DB] Storage cleared');
}

/**
 * Get offline storage size
 */
export function getOfflineStorageSize() {
  if (!IS_OFFLINE) return 0;
  return offlineStorage.size;
}

// Higher-level entity operations
export const entities = {
  /**
   * Get or create a user
   */
  async getOrCreateUser(userId: string, email: string): Promise<Record<string, any>> {
    const userKeys = keys.user(userId);
    let user = await db.get(userKeys.PK, userKeys.SK);

    if (!user) {
      user = {
        ...userKeys,
        userId,
        email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await db.put(user);
    }

    return user;
  },

  /**
   * Get all batches for a user
   */
  async getUserBatches(userId: string, limit?: number): Promise<Record<string, any>[]> {
    return await db.query({
      PK: `USER#${userId}`,
      SK: { beginsWith: 'BATCH#' },
      limit,
      sortAscending: false,
    });
  },

  /**
   * Get a batch by ID using GSI1
   */
  async getBatchById(batchId: string): Promise<Record<string, any> | null> {
    const results = await db.queryGSI1({
      GSI1PK: `BATCH#${batchId}`,
      limit: 1,
    });
    return results[0] || null;
  },

  /**
   * Get all events for a batch
   */
  async getBatchEvents(batchId: string, limit?: number): Promise<Record<string, any>[]> {
    return await db.query({
      PK: `BATCH#${batchId}`,
      SK: { beginsWith: 'EVENT#' },
      limit,
      sortAscending: false, // Most recent first
    });
  },

  /**
   * Get all reminders for a user
   */
  async getUserReminders(userId: string): Promise<Record<string, any>[]> {
    return await db.query({
      PK: `USER#${userId}`,
      SK: { beginsWith: 'REMINDER#' },
      sortAscending: true,
    });
  },

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string): Promise<Record<string, any>[]> {
    return await db.query({
      PK: `USER#${userId}`,
      SK: { beginsWith: 'DEVICE#' },
    });
  },
};

