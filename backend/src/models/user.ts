import { z } from 'zod';

export const UserSchema = z.object({
  PK: z.string(),
  SK: z.string(),
  userId: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

