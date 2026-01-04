import { z } from 'zod';
export declare const ReminderStatus: {
    readonly PENDING: "pending";
    readonly SENT: "sent";
    readonly CANCELLED: "cancelled";
};
export declare const ReminderSchema: z.ZodObject<{
    PK: z.ZodString;
    SK: z.ZodString;
    reminderId: z.ZodString;
    userId: z.ZodString;
    batchId: z.ZodString;
    scheduledTime: z.ZodString;
    message: z.ZodString;
    status: z.ZodEnum<["pending", "sent", "cancelled"]>;
    scheduleArn: z.ZodOptional<z.ZodString>;
    sentAt: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    PK: string;
    SK: string;
    updatedAt: string;
    userId: string;
    createdAt: string;
    batchId: string;
    status: "pending" | "sent" | "cancelled";
    message: string;
    reminderId: string;
    scheduledTime: string;
    scheduleArn?: string | undefined;
    sentAt?: string | undefined;
}, {
    PK: string;
    SK: string;
    updatedAt: string;
    userId: string;
    createdAt: string;
    batchId: string;
    status: "pending" | "sent" | "cancelled";
    message: string;
    reminderId: string;
    scheduledTime: string;
    scheduleArn?: string | undefined;
    sentAt?: string | undefined;
}>;
export type Reminder = z.infer<typeof ReminderSchema>;
export declare const ReminderSuggestionSchema: z.ZodObject<{
    type: z.ZodString;
    suggestedTime: z.ZodString;
    message: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: string;
    suggestedTime: string;
    description?: string | undefined;
}, {
    message: string;
    type: string;
    suggestedTime: string;
    description?: string | undefined;
}>;
export type ReminderSuggestion = z.infer<typeof ReminderSuggestionSchema>;
export declare const ConfirmReminderSchema: z.ZodObject<{
    reminders: z.ZodArray<z.ZodObject<{
        scheduledTime: z.ZodString;
        message: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        message: string;
        scheduledTime: string;
    }, {
        message: string;
        scheduledTime: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    reminders: {
        message: string;
        scheduledTime: string;
    }[];
}, {
    reminders: {
        message: string;
        scheduledTime: string;
    }[];
}>;
export type ConfirmReminderInput = z.infer<typeof ConfirmReminderSchema>;
/**
 * Calculate reminder suggestions based on batch parameters
 */
export declare function calculateReminderSuggestions(batch: {
    stage: string;
    startDate: string;
    targetDuration?: number;
}): ReminderSuggestion[];
//# sourceMappingURL=reminder.d.ts.map