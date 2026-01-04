/**
 * Mock AWS services for local development
 * 
 * This file provides simple in-memory implementations of AWS services
 * to enable local testing without deploying to AWS.
 */

// In-memory storage for DynamoDB
const dynamoStorage = new Map<string, any>();

// In-memory storage for S3
const s3Storage = new Map<string, Buffer>();

// In-memory storage for EventBridge schedules
const schedulerStorage = new Map<string, any>();

export const mockDynamoDB = {
  /**
   * Put item into in-memory DynamoDB
   */
  put: (tableName: string, item: any) => {
    const key = `${item.PK}#${item.SK}`;
    dynamoStorage.set(key, { ...item, updatedAt: new Date().toISOString() });
    console.log(`[MockDynamoDB] PUT ${key}`);
    return item;
  },

  /**
   * Get item from in-memory DynamoDB
   */
  get: (tableName: string, PK: string, SK: string) => {
    const key = `${PK}#${SK}`;
    const item = dynamoStorage.get(key);
    console.log(`[MockDynamoDB] GET ${key} - ${item ? 'found' : 'not found'}`);
    return item || null;
  },

  /**
   * Query items from in-memory DynamoDB
   */
  query: (tableName: string, PK: string, SKPrefix?: string) => {
    const items: any[] = [];
    for (const [key, value] of dynamoStorage.entries()) {
      if (key.startsWith(PK)) {
        if (!SKPrefix || value.SK.startsWith(SKPrefix)) {
          items.push(value);
        }
      }
    }
    console.log(`[MockDynamoDB] QUERY ${PK} ${SKPrefix || ''} - found ${items.length} items`);
    return items;
  },

  /**
   * Delete item from in-memory DynamoDB
   */
  delete: (tableName: string, PK: string, SK: string) => {
    const key = `${PK}#${SK}`;
    const deleted = dynamoStorage.delete(key);
    console.log(`[MockDynamoDB] DELETE ${key} - ${deleted ? 'success' : 'not found'}`);
    return deleted;
  },

  /**
   * Clear all data (useful for tests)
   */
  clear: () => {
    dynamoStorage.clear();
    console.log('[MockDynamoDB] Storage cleared');
  },

  /**
   * Get storage size
   */
  size: () => dynamoStorage.size,
};

export const mockS3 = {
  /**
   * Put object into in-memory S3
   */
  putObject: (bucket: string, key: string, data: Buffer | string) => {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    s3Storage.set(`${bucket}/${key}`, buffer);
    console.log(`[MockS3] PUT ${bucket}/${key} - ${buffer.length} bytes`);
    return { key };
  },

  /**
   * Get object from in-memory S3
   */
  getObject: (bucket: string, key: string) => {
    const data = s3Storage.get(`${bucket}/${key}`);
    console.log(`[MockS3] GET ${bucket}/${key} - ${data ? data.length + ' bytes' : 'not found'}`);
    return data || null;
  },

  /**
   * Delete object from in-memory S3
   */
  deleteObject: (bucket: string, key: string) => {
    const deleted = s3Storage.delete(`${bucket}/${key}`);
    console.log(`[MockS3] DELETE ${bucket}/${key} - ${deleted ? 'success' : 'not found'}`);
    return deleted;
  },

  /**
   * Generate presigned URL (mock)
   */
  getPresignedUrl: (bucket: string, key: string, operation: 'GET' | 'PUT') => {
    const url = `http://localhost:4566/${bucket}/${key}?mock=true&operation=${operation}`;
    console.log(`[MockS3] PRESIGNED URL ${operation} ${bucket}/${key}`);
    return url;
  },

  /**
   * Clear all data
   */
  clear: () => {
    s3Storage.clear();
    console.log('[MockS3] Storage cleared');
  },

  /**
   * Get storage size
   */
  size: () => s3Storage.size,
};

export const mockScheduler = {
  /**
   * Create schedule in memory
   */
  createSchedule: (name: string, schedule: any) => {
    schedulerStorage.set(name, {
      ...schedule,
      createdAt: new Date().toISOString(),
    });
    console.log(`[MockScheduler] CREATE ${name} - ${schedule.scheduleExpression}`);
    return {
      arn: `arn:aws:scheduler:local:000000000000:schedule/mock/${name}`,
    };
  },

  /**
   * Delete schedule from memory
   */
  deleteSchedule: (name: string) => {
    const deleted = schedulerStorage.delete(name);
    console.log(`[MockScheduler] DELETE ${name} - ${deleted ? 'success' : 'not found'}`);
    return deleted;
  },

  /**
   * Get schedule from memory
   */
  getSchedule: (name: string) => {
    const schedule = schedulerStorage.get(name);
    console.log(`[MockScheduler] GET ${name} - ${schedule ? 'found' : 'not found'}`);
    return schedule || null;
  },

  /**
   * List all schedules
   */
  listSchedules: () => {
    const schedules = Array.from(schedulerStorage.entries()).map(([name, schedule]) => ({
      name,
      ...schedule,
    }));
    console.log(`[MockScheduler] LIST - ${schedules.length} schedules`);
    return schedules;
  },

  /**
   * Clear all schedules
   */
  clear: () => {
    schedulerStorage.clear();
    console.log('[MockScheduler] Storage cleared');
  },

  /**
   * Get storage size
   */
  size: () => schedulerStorage.size,
};

/**
 * Clear all mock storage
 */
export function clearAllMockStorage() {
  mockDynamoDB.clear();
  mockS3.clear();
  mockScheduler.clear();
  console.log('[MockServices] All storage cleared');
}

/**
 * Get storage statistics
 */
export function getMockStorageStats() {
  return {
    dynamodb: mockDynamoDB.size(),
    s3: mockS3.size(),
    scheduler: mockScheduler.size(),
  };
}

