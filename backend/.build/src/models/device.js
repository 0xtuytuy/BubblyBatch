"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegisterDeviceSchema = exports.DeviceSchema = exports.DevicePlatform = void 0;
const zod_1 = require("zod");
exports.DevicePlatform = {
    IOS: 'ios',
    ANDROID: 'android',
};
exports.DeviceSchema = zod_1.z.object({
    PK: zod_1.z.string(),
    SK: zod_1.z.string(),
    deviceId: zod_1.z.string(),
    userId: zod_1.z.string(),
    platform: zod_1.z.enum([exports.DevicePlatform.IOS, exports.DevicePlatform.ANDROID]),
    token: zod_1.z.string(), // FCM or APNS token
    deviceName: zod_1.z.string().optional(),
    appVersion: zod_1.z.string().optional(),
    lastActiveAt: zod_1.z.string(),
    createdAt: zod_1.z.string(),
    updatedAt: zod_1.z.string(),
});
exports.RegisterDeviceSchema = zod_1.z.object({
    deviceId: zod_1.z.string().min(1),
    platform: zod_1.z.enum([exports.DevicePlatform.IOS, exports.DevicePlatform.ANDROID]),
    token: zod_1.z.string().min(1),
    deviceName: zod_1.z.string().optional(),
    appVersion: zod_1.z.string().optional(),
});
//# sourceMappingURL=device.js.map