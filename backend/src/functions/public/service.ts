import { entities } from '../../lib/db';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export interface PublicBatchView {
  batchId: string;
  name: string;
  stage: string;
  status: string;
  startDate: string;
  publicNote?: string;
  createdAt: string;
}

export class PublicService {
  /**
   * Get public batch view (no auth required)
   */
  async getPublicBatch(batchId: string): Promise<PublicBatchView> {
    const batch = await entities.getBatchById(batchId);

    if (!batch) {
      throw new NotFoundError('Batch not found');
    }

    if (!batch.isPublic) {
      throw new ForbiddenError('This batch is not publicly shared');
    }

    // Return only public-safe information
    return {
      batchId: batch.batchId,
      name: batch.name,
      stage: batch.stage,
      status: batch.status,
      startDate: batch.startDate,
      publicNote: batch.publicNote,
      createdAt: batch.createdAt,
    };
  }
}

