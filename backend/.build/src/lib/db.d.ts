export declare const keys: {
    user: (userId: string) => {
        PK: string;
        SK: string;
    };
    batch: (userId: string, batchId: string) => {
        PK: string;
        SK: string;
        GSI1PK: string;
        GSI1SK: string;
    };
    event: (batchId: string, timestamp: string) => {
        PK: string;
        SK: string;
    };
    reminder: (userId: string, reminderId: string) => {
        PK: string;
        SK: string;
    };
    device: (userId: string, deviceId: string) => {
        PK: string;
        SK: string;
    };
};
export declare const db: {
    /**
     * Put an item into DynamoDB (or offline storage)
     */
    put(item: Record<string, any>): Promise<void>;
    /**
     * Get a single item by PK and SK
     */
    get(PK: string, SK: string): Promise<Record<string, any> | null>;
    /**
     * Query items by PK with optional SK condition
     */
    query(params: {
        PK: string;
        SK?: {
            beginsWith?: string;
            equals?: string;
            between?: [string, string];
        };
        limit?: number;
        sortAscending?: boolean;
    }): Promise<Record<string, any>[]>;
    /**
     * Query using GSI1
     */
    queryGSI1(params: {
        GSI1PK: string;
        GSI1SK?: {
            beginsWith?: string;
            equals?: string;
        };
        limit?: number;
    }): Promise<Record<string, any>[]>;
    /**
     * Update an item with specific attributes
     */
    update(params: {
        PK: string;
        SK: string;
        updates: Record<string, any>;
    }): Promise<Record<string, any>>;
    /**
     * Delete an item
     */
    delete(PK: string, SK: string): Promise<void>;
    /**
     * Batch get multiple items
     */
    batchGet(keys: Array<{
        PK: string;
        SK: string;
    }>): Promise<Record<string, any>[]>;
    /**
     * Batch write (put or delete) multiple items
     */
    batchWrite(operations: Array<{
        put?: Record<string, any>;
        delete?: {
            PK: string;
            SK: string;
        };
    }>): Promise<void>;
};
/**
 * Seed offline storage with test data
 * Only used in offline mode
 */
export declare function seedOfflineData(): void;
/**
 * Clear offline storage
 */
export declare function clearOfflineData(): void;
/**
 * Get offline storage size
 */
export declare function getOfflineStorageSize(): number;
export declare const entities: {
    /**
     * Get or create a user
     */
    getOrCreateUser(userId: string, email: string): Promise<Record<string, any>>;
    /**
     * Get all batches for a user
     */
    getUserBatches(userId: string, limit?: number): Promise<Record<string, any>[]>;
    /**
     * Get a batch by ID using GSI1
     */
    getBatchById(batchId: string): Promise<Record<string, any> | null>;
    /**
     * Get all events for a batch
     */
    getBatchEvents(batchId: string, limit?: number): Promise<Record<string, any>[]>;
    /**
     * Get all reminders for a user
     */
    getUserReminders(userId: string): Promise<Record<string, any>[]>;
    /**
     * Get all devices for a user
     */
    getUserDevices(userId: string): Promise<Record<string, any>[]>;
};
//# sourceMappingURL=db.d.ts.map