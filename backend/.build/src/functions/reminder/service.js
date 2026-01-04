"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const uuid_1 = require("uuid");
const db_1 = require("../../lib/db");
const scheduler_1 = require("../../lib/scheduler");
const reminder_1 = require("../../models/reminder");
const errors_1 = require("../../utils/errors");
class ReminderService {
    /**
     * Get reminder suggestions for a batch
     */
    async getReminderSuggestions(batchId, userId) {
        // Verify the batch exists and user has access
        const batch = await db_1.entities.getBatchById(batchId);
        if (!batch) {
            throw new errors_1.NotFoundError('Batch not found');
        }
        if (batch.userId !== userId) {
            throw new errors_1.ForbiddenError('You do not have access to this batch');
        }
        // Calculate suggestions based on batch parameters
        const suggestions = (0, reminder_1.calculateReminderSuggestions)({
            stage: batch.stage,
            startDate: batch.startDate,
            targetDuration: batch.targetDuration,
        });
        return suggestions;
    }
    /**
     * Confirm and schedule reminders
     */
    async confirmReminders(batchId, userId, input) {
        // Verify the batch exists and user has access
        const batch = await db_1.entities.getBatchById(batchId);
        if (!batch) {
            throw new errors_1.NotFoundError('Batch not found');
        }
        if (batch.userId !== userId) {
            throw new errors_1.ForbiddenError('You do not have access to this batch');
        }
        const now = new Date().toISOString();
        const createdReminders = [];
        for (const reminderInput of input.reminders) {
            const reminderId = (0, uuid_1.v4)();
            const reminderKeys = db_1.keys.reminder(userId, reminderId);
            const scheduledTime = new Date(reminderInput.scheduledTime);
            // Validate scheduled time is in the future
            if (scheduledTime <= new Date()) {
                throw new errors_1.BadRequestError('Scheduled time must be in the future');
            }
            // Create the reminder in DynamoDB
            const reminder = {
                ...reminderKeys,
                reminderId,
                userId,
                batchId,
                scheduledTime: reminderInput.scheduledTime,
                message: reminderInput.message,
                status: reminder_1.ReminderStatus.PENDING,
                createdAt: now,
                updatedAt: now,
            };
            // Schedule with EventBridge
            try {
                const scheduleArn = await scheduler_1.scheduler.createReminder({
                    reminderId,
                    userId,
                    batchId,
                    scheduleTime: scheduledTime,
                    message: reminderInput.message,
                });
                reminder.scheduleArn = scheduleArn;
            }
            catch (error) {
                console.error('Failed to create EventBridge schedule:', error);
                throw new Error('Failed to schedule reminder');
            }
            await db_1.db.put(reminder);
            createdReminders.push(reminder);
        }
        return createdReminders;
    }
    /**
     * Get all reminders for a user
     */
    async getUserReminders(userId) {
        const reminders = await db_1.entities.getUserReminders(userId);
        return reminders;
    }
    /**
     * Cancel a reminder
     */
    async cancelReminder(reminderId, userId) {
        const reminderKeys = db_1.keys.reminder(userId, reminderId);
        const reminder = await db_1.db.get(reminderKeys.PK, reminderKeys.SK);
        if (!reminder) {
            throw new errors_1.NotFoundError('Reminder not found');
        }
        if (reminder.userId !== userId) {
            throw new errors_1.ForbiddenError('You do not have access to this reminder');
        }
        // Delete from EventBridge
        try {
            await scheduler_1.scheduler.deleteReminder(reminderId);
        }
        catch (error) {
            console.error('Failed to delete EventBridge schedule:', error);
            // Continue anyway to update DynamoDB
        }
        // Update status in DynamoDB
        await db_1.db.update({
            PK: reminderKeys.PK,
            SK: reminderKeys.SK,
            updates: {
                status: reminder_1.ReminderStatus.CANCELLED,
            },
        });
    }
    /**
     * Mark a reminder as sent (called by notification Lambda)
     */
    async markReminderAsSent(reminderId) {
        // Find the reminder - we need to find it first to get the userId
        const reminders = await db_1.db.query({
            PK: `USER#`,
            SK: { beginsWith: `REMINDER#${reminderId}` },
        });
        if (reminders.length === 0) {
            throw new errors_1.NotFoundError('Reminder not found');
        }
        const reminder = reminders[0];
        const reminderKeys = db_1.keys.reminder(reminder.userId, reminderId);
        await db_1.db.update({
            PK: reminderKeys.PK,
            SK: reminderKeys.SK,
            updates: {
                status: reminder_1.ReminderStatus.SENT,
                sentAt: new Date().toISOString(),
            },
        });
    }
}
exports.ReminderService = ReminderService;
//# sourceMappingURL=service.js.map