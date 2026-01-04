import { z } from 'zod';

export const BatchStage = {
  STAGE1_OPEN: 'stage1_open',
  STAGE2_BOTTLED: 'stage2_bottled',
} as const;

export const BatchStatus = {
  ACTIVE: 'active',
  IN_FRIDGE: 'in_fridge',
  READY: 'ready',
  ARCHIVED: 'archived',
} as const;

export const BatchSchema = z.object({
  PK: z.string(),
  SK: z.string(),
  GSI1PK: z.string(),
  GSI1SK: z.string(),
  batchId: z.string(),
  userId: z.string(),
  name: z.string(),
  stage: z.enum([BatchStage.STAGE1_OPEN, BatchStage.STAGE2_BOTTLED]),
  status: z.enum([
    BatchStatus.ACTIVE,
    BatchStatus.IN_FRIDGE,
    BatchStatus.READY,
    BatchStatus.ARCHIVED,
  ]),
  startDate: z.string(),
  targetDuration: z.number().optional(), // Duration in hours
  temperature: z.number().optional(), // Celsius
  sugarType: z.string().optional(),
  sugarAmount: z.number().optional(), // grams
  notes: z.string().optional(),
  photoKeys: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  publicNote: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Batch = z.infer<typeof BatchSchema>;

export const CreateBatchSchema = z.object({
  name: z.string().min(1).max(100),
  stage: z.enum([BatchStage.STAGE1_OPEN, BatchStage.STAGE2_BOTTLED]),
  startDate: z.string().datetime().optional(),
  targetDuration: z.number().min(1).max(720).optional(), // 1 hour to 30 days
  temperature: z.number().min(10).max(40).optional(),
  sugarType: z.string().max(50).optional(),
  sugarAmount: z.number().min(0).max(1000).optional(),
  notes: z.string().max(1000).optional(),
  isPublic: z.boolean().default(false),
  publicNote: z.string().max(500).optional(),
}).transform((data) => ({
  ...data,
  isPublic: data.isPublic ?? false, // Ensure isPublic is always boolean
}));

export type CreateBatchInput = z.infer<typeof CreateBatchSchema>;

export const UpdateBatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  stage: z.enum([BatchStage.STAGE1_OPEN, BatchStage.STAGE2_BOTTLED]).optional(),
  status: z
    .enum([BatchStatus.ACTIVE, BatchStatus.IN_FRIDGE, BatchStatus.READY, BatchStatus.ARCHIVED])
    .optional(),
  targetDuration: z.number().min(1).max(720).optional(),
  temperature: z.number().min(10).max(40).optional(),
  sugarType: z.string().max(50).optional(),
  sugarAmount: z.number().min(0).max(1000).optional(),
  notes: z.string().max(1000).optional(),
  isPublic: z.boolean().optional(),
  publicNote: z.string().max(500).optional(),
});

export type UpdateBatchInput = z.infer<typeof UpdateBatchSchema>;

export const BatchFiltersSchema = z.object({
  stage: z.enum([BatchStage.STAGE1_OPEN, BatchStage.STAGE2_BOTTLED]).optional(),
  status: z
    .enum([BatchStatus.ACTIVE, BatchStatus.IN_FRIDGE, BatchStatus.READY, BatchStatus.ARCHIVED])
    .optional(),
  limit: z.number().min(1).max(100).default(50).optional(),
});

export type BatchFilters = z.infer<typeof BatchFiltersSchema>;

