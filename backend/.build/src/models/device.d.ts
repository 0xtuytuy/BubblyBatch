import { z } from 'zod';
export declare const DevicePlatform: {
    readonly IOS: "ios";
    readonly ANDROID: "android";
};
export declare const DeviceSchema: z.ZodObject<{
    PK: z.ZodString;
    SK: z.ZodString;
    deviceId: z.ZodString;
    userId: z.ZodString;
    platform: z.ZodEnum<["ios", "android"]>;
    token: z.ZodString;
    deviceName: z.ZodOptional<z.ZodString>;
    appVersion: z.ZodOptional<z.ZodString>;
    lastActiveAt: z.ZodString;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    PK: string;
    SK: string;
    updatedAt: string;
    userId: string;
    createdAt: string;
    deviceId: string;
    platform: "ios" | "android";
    token: string;
    lastActiveAt: string;
    deviceName?: string | undefined;
    appVersion?: string | undefined;
}, {
    PK: string;
    SK: string;
    updatedAt: string;
    userId: string;
    createdAt: string;
    deviceId: string;
    platform: "ios" | "android";
    token: string;
    lastActiveAt: string;
    deviceName?: string | undefined;
    appVersion?: string | undefined;
}>;
export type Device = z.infer<typeof DeviceSchema>;
export declare const RegisterDeviceSchema: z.ZodObject<{
    deviceId: z.ZodString;
    platform: z.ZodEnum<["ios", "android"]>;
    token: z.ZodString;
    deviceName: z.ZodOptional<z.ZodString>;
    appVersion: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    deviceId: string;
    platform: "ios" | "android";
    token: string;
    deviceName?: string | undefined;
    appVersion?: string | undefined;
}, {
    deviceId: string;
    platform: "ios" | "android";
    token: string;
    deviceName?: string | undefined;
    appVersion?: string | undefined;
}>;
export type RegisterDeviceInput = z.infer<typeof RegisterDeviceSchema>;
//# sourceMappingURL=device.d.ts.map