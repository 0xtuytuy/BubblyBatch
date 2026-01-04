"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const service_1 = require("./service");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
const device_1 = require("../../models/device");
const validation_1 = require("../../utils/validation");
const response_1 = require("../../utils/response");
const errors_1 = require("../../utils/errors");
const userService = new service_1.UserService();
/**
 * Main handler that routes requests based on HTTP method and path
 */
async function main(event) {
    try {
        console.log('Event:', JSON.stringify(event, null, 2));
        const { userId, email } = (0, auth_1.getUserContext)(event);
        // Ensure user exists in database
        await db_1.entities.getOrCreateUser(userId, email);
        const method = event.requestContext.http.method;
        const path = event.rawPath;
        // Route to appropriate handler
        if (method === 'POST' && path === '/me/devices') {
            return await handleRegisterDevice(event, userId);
        }
        else if (method === 'GET' && path === '/me/devices') {
            return await handleListDevices(event, userId);
        }
        else if (method === 'DELETE' && path.match(/^\/me\/devices\/[^/]+$/)) {
            return await handleUnregisterDevice(event, userId);
        }
        return (0, response_1.notFound)('Route not found');
    }
    catch (err) {
        console.error('Error:', err);
        if (err instanceof validation_1.ValidationError) {
            return (0, response_1.badRequest)(JSON.stringify((0, validation_1.formatValidationErrors)(err.errors)));
        }
        const { statusCode, message } = (0, errors_1.handleError)(err);
        return (0, response_1.error)(message, statusCode);
    }
}
/**
 * POST /me/devices - Register a device for push notifications
 */
async function handleRegisterDevice(event, userId) {
    const input = (0, validation_1.parseBody)(event, device_1.RegisterDeviceSchema);
    const device = await userService.registerDevice(userId, input);
    return (0, response_1.created)({ device });
}
/**
 * GET /me/devices - List all devices for user
 */
async function handleListDevices(_event, userId) {
    const devices = await userService.getUserDevices(userId);
    return (0, response_1.success)({ devices, count: devices.length });
}
/**
 * DELETE /me/devices/:id - Unregister a device
 */
async function handleUnregisterDevice(_event, userId) {
    const deviceId = (0, validation_1.getPathParam)(_event, 'id');
    await userService.unregisterDevice(userId, deviceId);
    return (0, response_1.success)({ message: 'Device unregistered successfully' });
}
//# sourceMappingURL=handler.js.map