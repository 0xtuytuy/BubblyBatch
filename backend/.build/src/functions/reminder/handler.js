"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const service_1 = require("./service");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
const reminder_1 = require("../../models/reminder");
const validation_1 = require("../../utils/validation");
const response_1 = require("../../utils/response");
const errors_1 = require("../../utils/errors");
const reminderService = new service_1.ReminderService();
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
        if (method === 'GET' && path.match(/^\/batches\/[^/]+\/reminders\/suggestions$/)) {
            return await handleGetSuggestions(event, userId);
        }
        else if (method === 'POST' && path.match(/^\/batches\/[^/]+\/reminders\/confirm$/)) {
            return await handleConfirmReminders(event, userId);
        }
        else if (method === 'GET' && path === '/me/reminders') {
            return await handleListReminders(event, userId);
        }
        else if (method === 'DELETE' && path.match(/^\/me\/reminders\/[^/]+$/)) {
            return await handleCancelReminder(event, userId);
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
 * GET /batches/:id/reminders/suggestions - Get reminder suggestions
 */
async function handleGetSuggestions(event, userId) {
    const batchId = (0, validation_1.getPathParam)(event, 'id');
    const suggestions = await reminderService.getReminderSuggestions(batchId, userId);
    return (0, response_1.success)({ suggestions });
}
/**
 * POST /batches/:id/reminders/confirm - Confirm and schedule reminders
 */
async function handleConfirmReminders(event, userId) {
    const batchId = (0, validation_1.getPathParam)(event, 'id');
    const input = (0, validation_1.parseBody)(event, reminder_1.ConfirmReminderSchema);
    const reminders = await reminderService.confirmReminders(batchId, userId, input);
    return (0, response_1.created)({ reminders, count: reminders.length });
}
/**
 * GET /me/reminders - List all reminders for user
 */
async function handleListReminders(event, userId) {
    const reminders = await reminderService.getUserReminders(userId);
    // Filter out past reminders by default unless includeAll is set
    const includeAll = event.queryStringParameters?.includeAll === 'true';
    const now = new Date();
    let filteredReminders = reminders;
    if (!includeAll) {
        filteredReminders = reminders.filter((r) => r.status === 'pending' && new Date(r.scheduledTime) > now);
    }
    return (0, response_1.success)({ reminders: filteredReminders, count: filteredReminders.length });
}
/**
 * DELETE /me/reminders/:id - Cancel a reminder
 */
async function handleCancelReminder(event, userId) {
    const reminderId = (0, validation_1.getPathParam)(event, 'id');
    await reminderService.cancelReminder(reminderId, userId);
    return (0, response_1.success)({ message: 'Reminder cancelled successfully' });
}
//# sourceMappingURL=handler.js.map