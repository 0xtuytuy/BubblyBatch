import { v4 as uuidv4 } from 'uuid';
import { db, keys, entities } from '../../lib/db';
import { CreateEventInput, BatchEvent } from '../../models/event';
import { NotFoundError, ForbiddenError } from '../../utils/errors';

export class EventService {
  /**
   * Create a new event for a batch
   */
  async createEvent(batchId: string, userId: string, input: CreateEventInput): Promise<BatchEvent> {
    // Verify the batch exists and user has access
    const batch = await entities.getBatchById(batchId);
    if (!batch) {
      throw new NotFoundError('Batch not found');
    }
    if (batch.userId !== userId) {
      throw new ForbiddenError('You do not have access to this batch');
    }

    const eventId = uuidv4();
    const timestamp = input.timestamp || new Date().toISOString();
    const eventKeys = keys.event(batchId, timestamp);

    const event: BatchEvent = {
      ...eventKeys,
      eventId,
      batchId,
      userId,
      type: input.type,
      timestamp,
      description: input.description,
      metadata: input.metadata,
      photoKey: input.photoKey,
      createdAt: new Date().toISOString(),
    };

    await db.put(event);
    return event;
  }

  /**
   * Get all events for a batch
   */
  async getBatchEvents(batchId: string, userId: string, limit?: number): Promise<BatchEvent[]> {
    // Verify the batch exists and user has access
    const batch = await entities.getBatchById(batchId);
    if (!batch) {
      throw new NotFoundError('Batch not found');
    }
    if (batch.userId !== userId) {
      throw new ForbiddenError('You do not have access to this batch');
    }

    const events = await entities.getBatchEvents(batchId, limit);
    return events as BatchEvent[];
  }

  /**
   * Delete an event
   */
  async deleteEvent(batchId: string, timestamp: string, userId: string): Promise<void> {
    // Verify the batch exists and user has access
    const batch = await entities.getBatchById(batchId);
    if (!batch) {
      throw new NotFoundError('Batch not found');
    }
    if (batch.userId !== userId) {
      throw new ForbiddenError('You do not have access to this batch');
    }

    const eventKeys = keys.event(batchId, timestamp);
    await db.delete(eventKeys.PK, eventKeys.SK);
  }
}

