import { Reminder, ReminderSuggestion, ConfirmReminderInput } from '../../models/reminder';
export declare class ReminderService {
    /**
     * Get reminder suggestions for a batch
     */
    getReminderSuggestions(batchId: string, userId: string): Promise<ReminderSuggestion[]>;
    /**
     * Confirm and schedule reminders
     */
    confirmReminders(batchId: string, userId: string, input: ConfirmReminderInput): Promise<Reminder[]>;
    /**
     * Get all reminders for a user
     */
    getUserReminders(userId: string): Promise<Reminder[]>;
    /**
     * Cancel a reminder
     */
    cancelReminder(reminderId: string, userId: string): Promise<void>;
    /**
     * Mark a reminder as sent (called by notification Lambda)
     */
    markReminderAsSent(reminderId: string): Promise<void>;
}
//# sourceMappingURL=service.d.ts.map