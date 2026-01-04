import { z } from 'zod';
export declare const UserSchema: z.ZodObject<{
    PK: z.ZodString;
    SK: z.ZodString;
    userId: z.ZodString;
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    PK: string;
    SK: string;
    updatedAt: string;
    userId: string;
    email: string;
    createdAt: string;
    name?: string | undefined;
}, {
    PK: string;
    SK: string;
    updatedAt: string;
    userId: string;
    email: string;
    createdAt: string;
    name?: string | undefined;
}>;
export type User = z.infer<typeof UserSchema>;
export declare const CreateUserSchema: z.ZodObject<{
    email: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    name?: string | undefined;
}, {
    email: string;
    name?: string | undefined;
}>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
//# sourceMappingURL=user.d.ts.map