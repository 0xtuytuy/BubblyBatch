import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { UserService } from './service';
import { getUserContext } from '../../lib/auth';
import { entities } from '../../lib/db';
import { RegisterDeviceSchema } from '../../models/device';
import { parseBody, getPathParam, ValidationError, formatValidationErrors } from '../../utils/validation';
import { success, created, notFound, badRequest, error } from '../../utils/response';
import { handleError } from '../../utils/errors';

const userService = new UserService();

/**
 * Main handler that routes requests based on HTTP method and path
 */
export async function main(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));

    const { userId, email } = getUserContext(event);
    
    // Ensure user exists in database
    await entities.getOrCreateUser(userId, email);

    const method = event.requestContext.http.method;
    const path = event.rawPath;

    // Route to appropriate handler
    if (method === 'POST' && path === '/me/devices') {
      return await handleRegisterDevice(event, userId);
    } else if (method === 'GET' && path === '/me/devices') {
      return await handleListDevices(event, userId);
    } else if (method === 'DELETE' && path.match(/^\/me\/devices\/[^/]+$/)) {
      return await handleUnregisterDevice(event, userId);
    }

    return notFound('Route not found');
  } catch (err: any) {
    console.error('Error:', err);

    if (err instanceof ValidationError) {
      return badRequest(JSON.stringify(formatValidationErrors(err.errors)));
    }

    const { statusCode, message } = handleError(err);
    return error(message, statusCode);
  }
}

/**
 * POST /me/devices - Register a device for push notifications
 */
async function handleRegisterDevice(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const input = parseBody(event, RegisterDeviceSchema);
  const device = await userService.registerDevice(userId, input);
  return created({ device });
}

/**
 * GET /me/devices - List all devices for user
 */
async function handleListDevices(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const devices = await userService.getUserDevices(userId);
  return success({ devices, count: devices.length });
}

/**
 * DELETE /me/devices/:id - Unregister a device
 */
async function handleUnregisterDevice(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const deviceId = getPathParam(event, 'id');
  await userService.unregisterDevice(userId, deviceId);
  return success({ message: 'Device unregistered successfully' });
}

