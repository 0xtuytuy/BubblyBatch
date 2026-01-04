import { z } from 'zod';

export const DevicePlatform = {
  IOS: 'ios',
  ANDROID: 'android',
} as const;

export const DeviceSchema = z.object({
  PK: z.string(),
  SK: z.string(),
  deviceId: z.string(),
  userId: z.string(),
  platform: z.enum([DevicePlatform.IOS, DevicePlatform.ANDROID]),
  token: z.string(), // FCM or APNS token
  deviceName: z.string().optional(),
  appVersion: z.string().optional(),
  lastActiveAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Device = z.infer<typeof DeviceSchema>;

export const RegisterDeviceSchema = z.object({
  deviceId: z.string().min(1),
  platform: z.enum([DevicePlatform.IOS, DevicePlatform.ANDROID]),
  token: z.string().min(1),
  deviceName: z.string().optional(),
  appVersion: z.string().optional(),
});

export type RegisterDeviceInput = z.infer<typeof RegisterDeviceSchema>;

