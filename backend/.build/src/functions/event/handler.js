"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const service_1 = require("./service");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
const event_1 = require("../../models/event");
const validation_1 = require("../../utils/validation");
const response_1 = require("../../utils/response");
const errors_1 = require("../../utils/errors");
const eventService = new service_1.EventService();
/**
 * Main handler that routes requests based on HTTP method and path
 */
async function main(event) {
    try {
        console.log('Event:', JSON.stringify(event, null, 2));
        const { userId, email } = (0, auth_1.getUserContext)(event);
        // Ensure user exists in database
        await db_1.entities.getOrCreateUser(userId, email);
        const method = event.requestContext.http.method;
        const path = event.rawPath;
        // Route to appropriate handler
        if (method === 'POST' && path.match(/^\/batches\/[^/]+\/events$/)) {
            return await handleCreateEvent(event, userId);
        }
        else if (method === 'GET' && path.match(/^\/batches\/[^/]+\/events$/)) {
            return await handleListEvents(event, userId);
        }
        else if (method === 'DELETE' && path.match(/^\/batches\/[^/]+\/events\/[^/]+$/)) {
            return await handleDeleteEvent(event, userId);
        }
        return (0, response_1.notFound)('Route not found');
    }
    catch (err) {
        console.error('Error:', err);
        if (err instanceof validation_1.ValidationError) {
            return (0, response_1.badRequest)(JSON.stringify((0, validation_1.formatValidationErrors)(err.errors)));
        }
        const { statusCode, message } = (0, errors_1.handleError)(err);
        return (0, response_1.error)(message, statusCode);
    }
}
/**
 * POST /batches/:id/events - Create a new event
 */
async function handleCreateEvent(event, userId) {
    const batchId = (0, validation_1.getPathParam)(event, 'id');
    const input = (0, validation_1.parseBody)(event, event_1.CreateEventSchema);
    const batchEvent = await eventService.createEvent(batchId, userId, input);
    return (0, response_1.created)({ event: batchEvent });
}
/**
 * GET /batches/:id/events - List all events for a batch
 */
async function handleListEvents(event, userId) {
    const batchId = (0, validation_1.getPathParam)(event, 'id');
    const limit = event.queryStringParameters?.limit
        ? parseInt(event.queryStringParameters.limit)
        : undefined;
    const events = await eventService.getBatchEvents(batchId, userId, limit);
    return (0, response_1.success)({ events, count: events.length });
}
/**
 * DELETE /batches/:id/events/:timestamp - Delete an event
 */
async function handleDeleteEvent(event, userId) {
    const batchId = (0, validation_1.getPathParam)(event, 'id');
    const timestamp = (0, validation_1.getPathParam)(event, 'timestamp');
    await eventService.deleteEvent(batchId, timestamp, userId);
    return (0, response_1.success)({ message: 'Event deleted successfully' });
}
//# sourceMappingURL=handler.js.map