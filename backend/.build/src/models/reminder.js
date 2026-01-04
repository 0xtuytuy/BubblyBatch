"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmReminderSchema = exports.ReminderSuggestionSchema = exports.ReminderSchema = exports.ReminderStatus = void 0;
exports.calculateReminderSuggestions = calculateReminderSuggestions;
const zod_1 = require("zod");
exports.ReminderStatus = {
    PENDING: 'pending',
    SENT: 'sent',
    CANCELLED: 'cancelled',
};
exports.ReminderSchema = zod_1.z.object({
    PK: zod_1.z.string(),
    SK: zod_1.z.string(),
    reminderId: zod_1.z.string(),
    userId: zod_1.z.string(),
    batchId: zod_1.z.string(),
    scheduledTime: zod_1.z.string(),
    message: zod_1.z.string(),
    status: zod_1.z.enum([exports.ReminderStatus.PENDING, exports.ReminderStatus.SENT, exports.ReminderStatus.CANCELLED]),
    scheduleArn: zod_1.z.string().optional(), // EventBridge schedule ARN
    sentAt: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.ReminderSuggestionSchema = zod_1.z.object({
    type: zod_1.z.string(),
    suggestedTime: zod_1.z.string(),
    message: zod_1.z.string(),
    description: zod_1.z.string().optional(),
});
exports.ConfirmReminderSchema = zod_1.z.object({
    reminders: zod_1.z.array(zod_1.z.object({
        scheduledTime: zod_1.z.string().datetime(),
        message: zod_1.z.string().min(1).max(200),
    })),
});
/**
 * Calculate reminder suggestions based on batch parameters
 */
function calculateReminderSuggestions(batch) {
    const suggestions = [];
    const startTime = new Date(batch.startDate);
    if (batch.stage === 'stage1_open') {
        // Stage 1 (open container) suggestions
        if (batch.targetDuration) {
            // Midpoint check
            const midpoint = new Date(startTime.getTime() + (batch.targetDuration * 3600000) / 2);
            suggestions.push({
                type: 'midpoint_check',
                suggestedTime: midpoint.toISOString(),
                message: 'Check your kefir batch (halfway point)',
                description: 'Time to check the fermentation progress',
            });
            // Final check (target duration)
            const finalCheck = new Date(startTime.getTime() + batch.targetDuration * 3600000);
            suggestions.push({
                type: 'stage1_complete',
                suggestedTime: finalCheck.toISOString(),
                message: 'Your kefir may be ready for bottling',
                description: 'Stage 1 target duration reached',
            });
        }
        else {
            // Default 24h and 48h reminders if no target duration
            const check24h = new Date(startTime.getTime() + 24 * 3600000);
            suggestions.push({
                type: 'daily_check',
                suggestedTime: check24h.toISOString(),
                message: 'Daily kefir check (24h)',
                description: 'Check fermentation progress',
            });
            const check48h = new Date(startTime.getTime() + 48 * 3600000);
            suggestions.push({
                type: 'ready_check',
                suggestedTime: check48h.toISOString(),
                message: 'Your kefir may be ready (48h)',
                description: 'Check if ready for bottling',
            });
        }
    }
    else if (batch.stage === 'stage2_bottled') {
        // Stage 2 (bottled/hermetic) suggestions
        const targetDuration = batch.targetDuration || 24; // Default 24h for stage 2
        // Halfway check
        const midpoint = new Date(startTime.getTime() + (targetDuration * 3600000) / 2);
        suggestions.push({
            type: 'carbonation_check',
            suggestedTime: midpoint.toISOString(),
            message: 'Check carbonation level',
            description: 'Halfway through second fermentation',
        });
        // Ready reminder
        const ready = new Date(startTime.getTime() + targetDuration * 3600000);
        suggestions.push({
            type: 'stage2_complete',
            suggestedTime: ready.toISOString(),
            message: 'Your kefir is ready to refrigerate',
            description: 'Second fermentation complete',
        });
        // Refrigerate reminder (2 hours after ready)
        const refrigerate = new Date(ready.getTime() + 2 * 3600000);
        suggestions.push({
            type: 'refrigerate',
            suggestedTime: refrigerate.toISOString(),
            message: 'Move your kefir to the fridge',
            description: 'Prevent over-carbonation',
        });
    }
    return suggestions;
}
//# sourceMappingURL=reminder.js.map