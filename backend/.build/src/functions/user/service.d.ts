import { Device, RegisterDeviceInput } from '../../models/device';
export declare class UserService {
    /**
     * Register or update a device for push notifications
     */
    registerDevice(userId: string, input: RegisterDeviceInput): Promise<Device>;
    /**
     * Get all devices for a user
     */
    getUserDevices(userId: string): Promise<Device[]>;
    /**
     * Unregister a device
     */
    unregisterDevice(userId: string, deviceId: string): Promise<void>;
    /**
     * Update device last active timestamp
     */
    updateDeviceActivity(userId: string, deviceId: string): Promise<void>;
}
//# sourceMappingURL=service.d.ts.map