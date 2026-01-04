import { v4 as uuidv4 } from 'uuid';
import { db, keys, entities } from '../../lib/db';
import { scheduler } from '../../lib/scheduler';
import {
  Reminder,
  ReminderStatus,
  ReminderSuggestion,
  ConfirmReminderInput,
  calculateReminderSuggestions,
} from '../../models/reminder';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../utils/errors';

export class ReminderService {
  /**
   * Get reminder suggestions for a batch
   */
  async getReminderSuggestions(batchId: string, userId: string): Promise<ReminderSuggestion[]> {
    // Verify the batch exists and user has access
    const batch = await entities.getBatchById(batchId);
    if (!batch) {
      throw new NotFoundError('Batch not found');
    }
    if (batch.userId !== userId) {
      throw new ForbiddenError('You do not have access to this batch');
    }

    // Calculate suggestions based on batch parameters
    const suggestions = calculateReminderSuggestions({
      stage: batch.stage,
      startDate: batch.startDate,
      targetDuration: batch.targetDuration,
    });

    return suggestions;
  }

  /**
   * Confirm and schedule reminders
   */
  async confirmReminders(
    batchId: string,
    userId: string,
    input: ConfirmReminderInput
  ): Promise<Reminder[]> {
    // Verify the batch exists and user has access
    const batch = await entities.getBatchById(batchId);
    if (!batch) {
      throw new NotFoundError('Batch not found');
    }
    if (batch.userId !== userId) {
      throw new ForbiddenError('You do not have access to this batch');
    }

    const now = new Date().toISOString();
    const createdReminders: Reminder[] = [];

    for (const reminderInput of input.reminders) {
      const reminderId = uuidv4();
      const reminderKeys = keys.reminder(userId, reminderId);
      const scheduledTime = new Date(reminderInput.scheduledTime);

      // Validate scheduled time is in the future
      if (scheduledTime <= new Date()) {
        throw new BadRequestError('Scheduled time must be in the future');
      }

      // Create the reminder in DynamoDB
      const reminder: Reminder = {
        ...reminderKeys,
        reminderId,
        userId,
        batchId,
        scheduledTime: reminderInput.scheduledTime,
        message: reminderInput.message,
        status: ReminderStatus.PENDING,
        createdAt: now,
        updatedAt: now,
      };

      // Schedule with EventBridge
      try {
        const scheduleArn = await scheduler.createReminder({
          reminderId,
          userId,
          batchId,
          scheduleTime: scheduledTime,
          message: reminderInput.message,
        });

        reminder.scheduleArn = scheduleArn;
      } catch (error) {
        console.error('Failed to create EventBridge schedule:', error);
        throw new Error('Failed to schedule reminder');
      }

      await db.put(reminder);
      createdReminders.push(reminder);
    }

    return createdReminders;
  }

  /**
   * Get all reminders for a user
   */
  async getUserReminders(userId: string): Promise<Reminder[]> {
    const reminders = await entities.getUserReminders(userId);
    return reminders as Reminder[];
  }

  /**
   * Cancel a reminder
   */
  async cancelReminder(reminderId: string, userId: string): Promise<void> {
    const reminderKeys = keys.reminder(userId, reminderId);
    const reminder = await db.get(reminderKeys.PK, reminderKeys.SK);

    if (!reminder) {
      throw new NotFoundError('Reminder not found');
    }

    if (reminder.userId !== userId) {
      throw new ForbiddenError('You do not have access to this reminder');
    }

    // Delete from EventBridge
    try {
      await scheduler.deleteReminder(reminderId);
    } catch (error) {
      console.error('Failed to delete EventBridge schedule:', error);
      // Continue anyway to update DynamoDB
    }

    // Update status in DynamoDB
    await db.update({
      PK: reminderKeys.PK,
      SK: reminderKeys.SK,
      updates: {
        status: ReminderStatus.CANCELLED,
      },
    });
  }

  /**
   * Mark a reminder as sent (called by notification Lambda)
   */
  async markReminderAsSent(reminderId: string): Promise<void> {
    // Find the reminder - we need to find it first to get the userId
    const reminders = await db.query({
      PK: `USER#`,
      SK: { beginsWith: `REMINDER#${reminderId}` },
    });

    if (reminders.length === 0) {
      throw new NotFoundError('Reminder not found');
    }

    const reminder = reminders[0];
    const reminderKeys = keys.reminder(reminder.userId, reminderId);

    await db.update({
      PK: reminderKeys.PK,
      SK: reminderKeys.SK,
      updates: {
        status: ReminderStatus.SENT,
        sentAt: new Date().toISOString(),
      },
    });
  }
}

