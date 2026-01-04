import { z } from 'zod';

export const ReminderStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  CANCELLED: 'cancelled',
} as const;

export const ReminderSchema = z.object({
  PK: z.string(),
  SK: z.string(),
  reminderId: z.string(),
  userId: z.string(),
  batchId: z.string(),
  scheduledTime: z.string(),
  message: z.string(),
  status: z.enum([ReminderStatus.PENDING, ReminderStatus.SENT, ReminderStatus.CANCELLED]),
  scheduleArn: z.string().optional(), // EventBridge schedule ARN
  sentAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Reminder = z.infer<typeof ReminderSchema>;

export const ReminderSuggestionSchema = z.object({
  type: z.string(),
  suggestedTime: z.string(),
  message: z.string(),
  description: z.string().optional(),
});

export type ReminderSuggestion = z.infer<typeof ReminderSuggestionSchema>;

export const ConfirmReminderSchema = z.object({
  reminders: z.array(
    z.object({
      scheduledTime: z.string().datetime(),
      message: z.string().min(1).max(200),
    })
  ),
});

export type ConfirmReminderInput = z.infer<typeof ConfirmReminderSchema>;

/**
 * Calculate reminder suggestions based on batch parameters
 */
export function calculateReminderSuggestions(batch: {
  stage: string;
  startDate: string;
  targetDuration?: number;
}): ReminderSuggestion[] {
  const suggestions: ReminderSuggestion[] = [];
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
    } else {
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
  } else if (batch.stage === 'stage2_bottled') {
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

