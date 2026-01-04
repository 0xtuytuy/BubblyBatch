"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const db_1 = require("../../lib/db");
class UserService {
    /**
     * Register or update a device for push notifications
     */
    async registerDevice(userId, input) {
        const deviceKeys = db_1.keys.device(userId, input.deviceId);
        const now = new Date().toISOString();
        // Check if device already exists
        const existingDevice = await db_1.db.get(deviceKeys.PK, deviceKeys.SK);
        if (existingDevice) {
            // Update existing device
            const updated = await db_1.db.update({
                PK: deviceKeys.PK,
                SK: deviceKeys.SK,
                updates: {
                    token: input.token,
                    platform: input.platform,
                    deviceName: input.deviceName,
                    appVersion: input.appVersion,
                    lastActiveAt: now,
                },
            });
            return updated;
        }
        // Create new device
        const device = {
            ...deviceKeys,
            deviceId: input.deviceId,
            userId,
            platform: input.platform,
            token: input.token,
            deviceName: input.deviceName,
            appVersion: input.appVersion,
            lastActiveAt: now,
            createdAt: now,
            updatedAt: now,
        };
        await db_1.db.put(device);
        return device;
    }
    /**
     * Get all devices for a user
     */
    async getUserDevices(userId) {
        const devices = await db_1.entities.getUserDevices(userId);
        return devices;
    }
    /**
     * Unregister a device
     */
    async unregisterDevice(userId, deviceId) {
        const deviceKeys = db_1.keys.device(userId, deviceId);
        await db_1.db.delete(deviceKeys.PK, deviceKeys.SK);
    }
    /**
     * Update device last active timestamp
     */
    async updateDeviceActivity(userId, deviceId) {
        const deviceKeys = db_1.keys.device(userId, deviceId);
        await db_1.db.update({
            PK: deviceKeys.PK,
            SK: deviceKeys.SK,
            updates: {
                lastActiveAt: new Date().toISOString(),
            },
        });
    }
}
exports.UserService = UserService;
//# sourceMappingURL=service.js.map