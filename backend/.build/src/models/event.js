"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEventSchema = exports.BatchEventSchema = exports.EventType = void 0;
const zod_1 = require("zod");
exports.EventType = {
    STAGE_CHANGE: 'stage_change',
    OBSERVATION: 'observation',
    PHOTO_ADDED: 'photo_added',
    STATUS_CHANGE: 'status_change',
    NOTE: 'note',
};
exports.BatchEventSchema = zod_1.z.object({
    PK: zod_1.z.string(),
    SK: zod_1.z.string(),
    eventId: zod_1.z.string(),
    batchId: zod_1.z.string(),
    userId: zod_1.z.string(),
    type: zod_1.z.enum([
        exports.EventType.STAGE_CHANGE,
        exports.EventType.OBSERVATION,
        exports.EventType.PHOTO_ADDED,
        exports.EventType.STATUS_CHANGE,
        exports.EventType.NOTE,
    ]),
    timestamp: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(), // Flexible field for event-specific data
    photoKey: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(),
});
exports.CreateEventSchema = zod_1.z.object({
    type: zod_1.z.enum([
        exports.EventType.STAGE_CHANGE,
        exports.EventType.OBSERVATION,
        exports.EventType.PHOTO_ADDED,
        exports.EventType.STATUS_CHANGE,
        exports.EventType.NOTE,
    ]),
    description: zod_1.z.string().max(1000),
    timestamp: zod_1.z.string().datetime().optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    photoKey: zod_1.z.string().optional(),
});
//# sourceMappingURL=event.js.map