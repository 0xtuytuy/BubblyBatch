import { CreateEventInput, BatchEvent } from '../../models/event';
export declare class EventService {
    /**
     * Create a new event for a batch
     */
    createEvent(batchId: string, userId: string, input: CreateEventInput): Promise<BatchEvent>;
    /**
     * Get all events for a batch
     */
    getBatchEvents(batchId: string, userId: string, limit?: number): Promise<BatchEvent[]>;
    /**
     * Delete an event
     */
    deleteEvent(batchId: string, timestamp: string, userId: string): Promise<void>;
}
//# sourceMappingURL=service.d.ts.map