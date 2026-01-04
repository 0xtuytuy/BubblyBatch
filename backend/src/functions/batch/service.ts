import { v4 as uuidv4 } from 'uuid';
import { db, keys, entities } from '../../lib/db';
import { s3 } from '../../lib/s3';
import { CreateBatchInput, UpdateBatchInput, BatchStatus, Batch, BatchFilters } from '../../models/batch';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export class BatchService {
  /**
   * Create a new batch
   */
  async createBatch(userId: string, input: CreateBatchInput): Promise<Batch> {
    const batchId = uuidv4();
    const batchKeys = keys.batch(userId, batchId);
    const now = new Date().toISOString();

    const batch: Batch = {
      ...batchKeys,
      batchId,
      userId,
      name: input.name,
      stage: input.stage,
      status: BatchStatus.ACTIVE,
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

    await db.put(batch);
    return batch;
  }

  /**
   * Get all batches for a user with optional filters
   */
  async getUserBatches(userId: string, filters?: BatchFilters): Promise<Batch[]> {
    let batches = await entities.getUserBatches(userId, filters?.limit);

    // Apply filters
    if (filters?.stage) {
      batches = batches.filter((b) => b.stage === filters.stage);
    }
    if (filters?.status) {
      batches = batches.filter((b) => b.status === filters.status);
    }

    return batches as Batch[];
  }

  /**
   * Get a batch by ID and verify access
   */
  async getBatch(batchId: string, userId: string): Promise<Batch> {
    const batch = await entities.getBatchById(batchId);

    if (!batch) {
      throw new NotFoundError('Batch not found');
    }

    if (batch.userId !== userId) {
      throw new ForbiddenError('You do not have access to this batch');
    }

    return batch as Batch;
  }

  /**
   * Update a batch
   */
  async updateBatch(batchId: string, userId: string, updates: UpdateBatchInput): Promise<Batch> {
    // First verify the batch exists and user has access
    const batch = await this.getBatch(batchId, userId);

    const batchKeys = keys.batch(userId, batchId);
    const updated = await db.update({
      PK: batchKeys.PK,
      SK: batchKeys.SK,
      updates: updates as Record<string, any>,
    });

    return updated as Batch;
  }

  /**
   * Delete a batch (soft delete by archiving)
   */
  async deleteBatch(batchId: string, userId: string): Promise<void> {
    const batch = await this.getBatch(batchId, userId);

    // Soft delete by archiving
    const batchKeys = keys.batch(userId, batchId);
    await db.update({
      PK: batchKeys.PK,
      SK: batchKeys.SK,
      updates: { status: BatchStatus.ARCHIVED },
    });
  }

  /**
   * Get a presigned URL for photo upload
   */
  async getPhotoUploadUrl(
    batchId: string,
    userId: string,
    filename: string,
    contentType: string
  ): Promise<{ uploadUrl: string; photoKey: string }> {
    // Verify batch exists and user has access
    await this.getBatch(batchId, userId);

    const photoKey = s3.generatePhotoKey(userId, batchId, filename);
    const uploadUrl = await s3.getUploadUrl(photoKey, contentType);

    return { uploadUrl, photoKey };
  }

  /**
   * Add a photo key to a batch
   */
  async addPhotoToBatch(batchId: string, userId: string, photoKey: string): Promise<Batch> {
    const batch = await this.getBatch(batchId, userId);

    const photoKeys = batch.photoKeys || [];
    photoKeys.push(photoKey);

    const batchKeys = keys.batch(userId, batchId);
    const updated = await db.update({
      PK: batchKeys.PK,
      SK: batchKeys.SK,
      updates: { photoKeys },
    });

    return updated as Batch;
  }

  /**
   * Get photo download URLs for a batch
   */
  async getBatchPhotoUrls(batchId: string, userId: string): Promise<string[]> {
    const batch = await this.getBatch(batchId, userId);

    if (!batch.photoKeys || batch.photoKeys.length === 0) {
      return [];
    }

    const urls = await Promise.all(
      batch.photoKeys.map((key) => s3.getDownloadUrl(key))
    );

    return urls;
  }
}

