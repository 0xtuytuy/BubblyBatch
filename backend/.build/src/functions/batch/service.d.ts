import { CreateBatchInput, UpdateBatchInput, Batch, BatchFilters } from '../../models/batch';
export declare class BatchService {
    /**
     * Create a new batch
     */
    createBatch(userId: string, input: CreateBatchInput): Promise<Batch>;
    /**
     * Get all batches for a user with optional filters
     */
    getUserBatches(userId: string, filters?: BatchFilters): Promise<Batch[]>;
    /**
     * Get a batch by ID and verify access
     */
    getBatch(batchId: string, userId: string): Promise<Batch>;
    /**
     * Update a batch
     */
    updateBatch(batchId: string, userId: string, updates: UpdateBatchInput): Promise<Batch>;
    /**
     * Delete a batch (soft delete by archiving)
     */
    deleteBatch(batchId: string, userId: string): Promise<void>;
    /**
     * Get a presigned URL for photo upload
     */
    getPhotoUploadUrl(batchId: string, userId: string, filename: string, contentType: string): Promise<{
        uploadUrl: string;
        photoKey: string;
    }>;
    /**
     * Add a photo key to a batch
     */
    addPhotoToBatch(batchId: string, userId: string, photoKey: string): Promise<Batch>;
    /**
     * Get photo download URLs for a batch
     */
    getBatchPhotoUrls(batchId: string, userId: string): Promise<string[]>;
}
//# sourceMappingURL=service.d.ts.map