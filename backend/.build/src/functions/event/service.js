"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventService = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../../lib/db");
const errors_1 = require("../../utils/errors");
class EventService {
    /**
     * Create a new event for a batch
     */
    async createEvent(batchId, userId, input) {
        // Verify the batch exists and user has access
        const batch = await db_1.entities.getBatchById(batchId);
        if (!batch) {
            throw new errors_1.NotFoundError('Batch not found');
        }
        if (batch.userId !== userId) {
            throw new errors_1.ForbiddenError('You do not have access to this batch');
        }
        const eventId = (0, uuid_1.v4)();
        const timestamp = input.timestamp || new Date().toISOString();
        const eventKeys = db_1.keys.event(batchId, timestamp);
        const event = {
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
        await db_1.db.put(event);
        return event;
    }
    /**
     * Get all events for a batch
     */
    async getBatchEvents(batchId, userId, limit) {
        // Verify the batch exists and user has access
        const batch = await db_1.entities.getBatchById(batchId);
        if (!batch) {
            throw new errors_1.NotFoundError('Batch not found');
        }
        if (batch.userId !== userId) {
            throw new errors_1.ForbiddenError('You do not have access to this batch');
        }
        const events = await db_1.entities.getBatchEvents(batchId, limit);
        return events;
    }
    /**
     * Delete an event
     */
    async deleteEvent(batchId, timestamp, userId) {
        // Verify the batch exists and user has access
        const batch = await db_1.entities.getBatchById(batchId);
        if (!batch) {
            throw new errors_1.NotFoundError('Batch not found');
        }
        if (batch.userId !== userId) {
            throw new errors_1.ForbiddenError('You do not have access to this batch');
        }
        const eventKeys = db_1.keys.event(batchId, timestamp);
        await db_1.db.delete(eventKeys.PK, eventKeys.SK);
    }
}
exports.EventService = EventService;
//# sourceMappingURL=service.js.map