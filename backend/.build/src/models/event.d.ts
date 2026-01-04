import { z } from 'zod';
export declare const EventType: {
    readonly STAGE_CHANGE: "stage_change";
    readonly OBSERVATION: "observation";
    readonly PHOTO_ADDED: "photo_added";
    readonly STATUS_CHANGE: "status_change";
    readonly NOTE: "note";
};
export declare const BatchEventSchema: z.ZodObject<{
    PK: z.ZodString;
    SK: z.ZodString;
    eventId: z.ZodString;
    batchId: z.ZodString;
    userId: z.ZodString;
    type: z.ZodEnum<["stage_change", "observation", "photo_added", "status_change", "note"]>;
    timestamp: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    photoKey: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    PK: string;
    SK: string;
    userId: string;
    createdAt: string;
    batchId: string;
    type: "stage_change" | "observation" | "photo_added" | "status_change" | "note";
    eventId: string;
    timestamp: string;
    metadata?: Record<string, any> | undefined;
    photoKey?: string | undefined;
    description?: string | undefined;
}, {
    PK: string;
    SK: string;
    userId: string;
    createdAt: string;
    batchId: string;
    type: "stage_change" | "observation" | "photo_added" | "status_change" | "note";
    eventId: string;
    timestamp: string;
    metadata?: Record<string, any> | undefined;
    photoKey?: string | undefined;
    description?: string | undefined;
}>;
export type BatchEvent = z.infer<typeof BatchEventSchema>;
export declare const CreateEventSchema: z.ZodObject<{
    type: z.ZodEnum<["stage_change", "observation", "photo_added", "status_change", "note"]>;
    description: z.ZodString;
    timestamp: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    photoKey: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "stage_change" | "observation" | "photo_added" | "status_change" | "note";
    description: string;
    metadata?: Record<string, any> | undefined;
    photoKey?: string | undefined;
    timestamp?: string | undefined;
}, {
    type: "stage_change" | "observation" | "photo_added" | "status_change" | "note";
    description: string;
    metadata?: Record<string, any> | undefined;
    photoKey?: string | undefined;
    timestamp?: string | undefined;
}>;
export type CreateEventInput = z.infer<typeof CreateEventSchema>;
//# sourceMappingURL=event.d.ts.map