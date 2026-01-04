import { db, keys, entities } from '../../lib/db';
import { Device, RegisterDeviceInput } from '../../models/device';
import { ConflictError } from '../../utils/errors';

export class UserService {
  /**
   * Register or update a device for push notifications
   */
  async registerDevice(userId: string, input: RegisterDeviceInput): Promise<Device> {
    const deviceKeys = keys.device(userId, input.deviceId);
    const now = new Date().toISOString();

    // Check if device already exists
    const existingDevice = await db.get(deviceKeys.PK, deviceKeys.SK);

    if (existingDevice) {
      // Update existing device
      const updated = await db.update({
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
      return updated as Device;
    }

    // Create new device
    const device: Device = {
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

    await db.put(device);
    return device;
  }

  /**
   * Get all devices for a user
   */
  async getUserDevices(userId: string): Promise<Device[]> {
    const devices = await entities.getUserDevices(userId);
    return devices as Device[];
  }

  /**
   * Unregister a device
   */
  async unregisterDevice(userId: string, deviceId: string): Promise<void> {
    const deviceKeys = keys.device(userId, deviceId);
    await db.delete(deviceKeys.PK, deviceKeys.SK);
  }

  /**
   * Update device last active timestamp
   */
  async updateDeviceActivity(userId: string, deviceId: string): Promise<void> {
    const deviceKeys = keys.device(userId, deviceId);
    await db.update({
      PK: deviceKeys.PK,
      SK: deviceKeys.SK,
      updates: {
        lastActiveAt: new Date().toISOString(),
      },
    });
  }
}

