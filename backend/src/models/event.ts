import { z } from 'zod';

export const EventType = {
  STAGE_CHANGE: 'stage_change',
  OBSERVATION: 'observation',
  PHOTO_ADDED: 'photo_added',
  STATUS_CHANGE: 'status_change',
  NOTE: 'note',
} as const;

export const BatchEventSchema = z.object({
  PK: z.string(),
  SK: z.string(),
  eventId: z.string(),
  batchId: z.string(),
  userId: z.string(),
  type: z.enum([
    EventType.STAGE_CHANGE,
    EventType.OBSERVATION,
    EventType.PHOTO_ADDED,
    EventType.STATUS_CHANGE,
    EventType.NOTE,
  ]),
  timestamp: z.string(),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(), // Flexible field for event-specific data
  photoKey: z.string().optional(),
  createdAt: z.string(),
});

export type BatchEvent = z.infer<typeof BatchEventSchema>;

export const CreateEventSchema = z.object({
  type: z.enum([
    EventType.STAGE_CHANGE,
    EventType.OBSERVATION,
    EventType.PHOTO_ADDED,
    EventType.STATUS_CHANGE,
    EventType.NOTE,
  ]),
  description: z.string().max(1000),
  timestamp: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
  photoKey: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;

