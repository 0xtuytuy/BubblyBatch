"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchFiltersSchema = exports.UpdateBatchSchema = exports.CreateBatchSchema = exports.BatchSchema = exports.BatchStatus = exports.BatchStage = void 0;
const zod_1 = require("zod");
exports.BatchStage = {
    STAGE1_OPEN: 'stage1_open',
    STAGE2_BOTTLED: 'stage2_bottled',
};
exports.BatchStatus = {
    ACTIVE: 'active',
    IN_FRIDGE: 'in_fridge',
    READY: 'ready',
    ARCHIVED: 'archived',
};
exports.BatchSchema = zod_1.z.object({
    PK: zod_1.z.string(),
    SK: zod_1.z.string(),
    GSI1PK: zod_1.z.string(),
    GSI1SK: zod_1.z.string(),
    batchId: zod_1.z.string(),
    userId: zod_1.z.string(),
    name: zod_1.z.string(),
    stage: zod_1.z.enum([exports.BatchStage.STAGE1_OPEN, exports.BatchStage.STAGE2_BOTTLED]),
    status: zod_1.z.enum([
        exports.BatchStatus.ACTIVE,
        exports.BatchStatus.IN_FRIDGE,
        exports.BatchStatus.READY,
        exports.BatchStatus.ARCHIVED,
    ]),
    startDate: zod_1.z.string(),
    targetDuration: zod_1.z.number().optional(), // Duration in hours
    temperature: zod_1.z.number().optional(), // Celsius
    sugarType: zod_1.z.string().optional(),
    sugarAmount: zod_1.z.number().optional(), // grams
    notes: zod_1.z.string().optional(),
    photoKeys: zod_1.z.array(zod_1.z.string()).optional(),
    isPublic: zod_1.z.boolean().default(false),
    publicNote: zod_1.z.string().optional(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.CreateBatchSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100),
    stage: zod_1.z.enum([exports.BatchStage.STAGE1_OPEN, exports.BatchStage.STAGE2_BOTTLED]),
    startDate: zod_1.z.string().datetime().optional(),
    targetDuration: zod_1.z.number().min(1).max(720).optional(), // 1 hour to 30 days
    temperature: zod_1.z.number().min(10).max(40).optional(),
    sugarType: zod_1.z.string().max(50).optional(),
    sugarAmount: zod_1.z.number().min(0).max(1000).optional(),
    notes: zod_1.z.string().max(1000).optional(),
    isPublic: zod_1.z.boolean().default(false),
    publicNote: zod_1.z.string().max(500).optional(),
}).transform((data) => ({
    ...data,
    isPublic: data.isPublic ?? false, // Ensure isPublic is always boolean
}));
exports.UpdateBatchSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    stage: zod_1.z.enum([exports.BatchStage.STAGE1_OPEN, exports.BatchStage.STAGE2_BOTTLED]).optional(),
    status: zod_1.z
        .enum([exports.BatchStatus.ACTIVE, exports.BatchStatus.IN_FRIDGE, exports.BatchStatus.READY, exports.BatchStatus.ARCHIVED])
        .optional(),
    targetDuration: zod_1.z.number().min(1).max(720).optional(),
    temperature: zod_1.z.number().min(10).max(40).optional(),
    sugarType: zod_1.z.string().max(50).optional(),
    sugarAmount: zod_1.z.number().min(0).max(1000).optional(),
    notes: zod_1.z.string().max(1000).optional(),
    isPublic: zod_1.z.boolean().optional(),
    publicNote: zod_1.z.string().max(500).optional(),
});
exports.BatchFiltersSchema = zod_1.z.object({
    stage: zod_1.z.enum([exports.BatchStage.STAGE1_OPEN, exports.BatchStage.STAGE2_BOTTLED]).optional(),
    status: zod_1.z
        .enum([exports.BatchStatus.ACTIVE, exports.BatchStatus.IN_FRIDGE, exports.BatchStatus.READY, exports.BatchStatus.ARCHIVED])
        .optional(),
    limit: zod_1.z.number().min(1).max(100).default(50).optional(),
});
//# sourceMappingURL=batch.js.map