export declare const scheduler: {
    /**
     * Create a scheduled reminder (or mock schedule in offline mode)
     */
    createReminder(params: {
        reminderId: string;
        userId: string;
        batchId: string;
        scheduleTime: Date;
        message: string;
    }): Promise<string>;
    /**
     * Delete a scheduled reminder (or from offline storage)
     */
    deleteReminder(reminderId: string): Promise<void>;
    /**
     * Check if a reminder schedule exists
     */
    reminderExists(reminderId: string): Promise<boolean>;
};
//# sourceMappingURL=scheduler.d.ts.map