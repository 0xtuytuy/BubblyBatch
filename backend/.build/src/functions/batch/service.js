"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchService = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../../lib/db");
const s3_1 = require("../../lib/s3");
const batch_1 = require("../../models/batch");
const errors_1 = require("../../utils/errors");
class BatchService {
    /**
     * Create a new batch
     */
    async createBatch(userId, input) {
        const batchId = (0, uuid_1.v4)();
        const batchKeys = db_1.keys.batch(userId, batchId);
        const now = new Date().toISOString();
        const batch = {
            ...batchKeys,
            batchId,
            userId,
            name: input.name,
            stage: input.stage,
            status: batch_1.BatchStatus.ACTIVE,
            startDate: input.startDate || now,
            targetDuration: input.targetDuration,
            temperature: input.temperature,
            sugarType: input.sugarType,
            sugarAmount: input.sugarAmount,
            notes: input.notes,
            photoKeys: [],
            isPublic: input.isPublic ?? false,
            publicNote: input.publicNote,
            createdAt: now,
            updatedAt: now,
        };
        await db_1.db.put(batch);
        return batch;
    }
    /**
     * Get all batches for a user with optional filters
     */
    async getUserBatches(userId, filters) {
        let batches = await db_1.entities.getUserBatches(userId, filters?.limit);
        // Apply filters
        if (filters?.stage) {
            batches = batches.filter((b) => b.stage === filters.stage);
        }
        if (filters?.status) {
            batches = batches.filter((b) => b.status === filters.status);
        }
        return batches;
    }
    /**
     * Get a batch by ID and verify access
     */
    async getBatch(batchId, userId) {
        const batch = await db_1.entities.getBatchById(batchId);
        if (!batch) {
            throw new errors_1.NotFoundError('Batch not found');
        }
        if (batch.userId !== userId) {
            throw new errors_1.ForbiddenError('You do not have access to this batch');
        }
        return batch;
    }
    /**
     * Update a batch
     */
    async updateBatch(batchId, userId, updates) {
        // First verify the batch exists and user has access
        await this.getBatch(batchId, userId);
        const batchKeys = db_1.keys.batch(userId, batchId);
        const updated = await db_1.db.update({
            PK: batchKeys.PK,
            SK: batchKeys.SK,
            updates: updates,
        });
        return updated;
    }
    /**
     * Delete a batch (soft delete by archiving)
     */
    async deleteBatch(batchId, userId) {
        await this.getBatch(batchId, userId);
        // Soft delete by archiving
        const batchKeys = db_1.keys.batch(userId, batchId);
        await db_1.db.update({
            PK: batchKeys.PK,
            SK: batchKeys.SK,
            updates: { status: batch_1.BatchStatus.ARCHIVED },
        });
    }
    /**
     * Get a presigned URL for photo upload
     */
    async getPhotoUploadUrl(batchId, userId, filename, contentType) {
        // Verify batch exists and user has access
        await this.getBatch(batchId, userId);
        const photoKey = s3_1.s3.generatePhotoKey(userId, batchId, filename);
        const uploadUrl = await s3_1.s3.getUploadUrl(photoKey, contentType);
        return { uploadUrl, photoKey };
    }
    /**
     * Add a photo key to a batch
     */
    async addPhotoToBatch(batchId, userId, photoKey) {
        const batch = await this.getBatch(batchId, userId);
        const photoKeys = batch.photoKeys || [];
        photoKeys.push(photoKey);
        const batchKeys = db_1.keys.batch(userId, batchId);
        const updated = await db_1.db.update({
            PK: batchKeys.PK,
            SK: batchKeys.SK,
            updates: { photoKeys },
        });
        return updated;
    }
    /**
     * Get photo download URLs for a batch
     */
    async getBatchPhotoUrls(batchId, userId) {
        const batch = await this.getBatch(batchId, userId);
        if (!batch.photoKeys || batch.photoKeys.length === 0) {
            return [];
        }
        const urls = await Promise.all(batch.photoKeys.map((key) => s3_1.s3.getDownloadUrl(key)));
        return urls;
    }
}
exports.BatchService = BatchService;
//# sourceMappingURL=service.js.map