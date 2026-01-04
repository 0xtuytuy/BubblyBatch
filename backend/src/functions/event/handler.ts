import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { EventService } from './service';
import { getUserContext } from '../../lib/auth';
import { entities } from '../../lib/db';
import { CreateEventSchema } from '../../models/event';
import { parseBody, getPathParam, ValidationError, formatValidationErrors } from '../../utils/validation';
import { success, created, notFound, badRequest, error } from '../../utils/response';
import { handleError } from '../../utils/errors';

const eventService = new EventService();

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
    if (method === 'POST' && path.match(/^\/batches\/[^/]+\/events$/)) {
      return await handleCreateEvent(event, userId);
    } else if (method === 'GET' && path.match(/^\/batches\/[^/]+\/events$/)) {
      return await handleListEvents(event, userId);
    } else if (method === 'DELETE' && path.match(/^\/batches\/[^/]+\/events\/[^/]+$/)) {
      return await handleDeleteEvent(event, userId);
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
 * POST /batches/:id/events - Create a new event
 */
async function handleCreateEvent(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'id');
  const input = parseBody(event, CreateEventSchema);
  const batchEvent = await eventService.createEvent(batchId, userId, input);
  return created({ event: batchEvent });
}

/**
 * GET /batches/:id/events - List all events for a batch
 */
async function handleListEvents(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'id');
  const limit = event.queryStringParameters?.limit
    ? parseInt(event.queryStringParameters.limit)
    : undefined;

  const events = await eventService.getBatchEvents(batchId, userId, limit);
  return success({ events, count: events.length });
}

/**
 * DELETE /batches/:id/events/:timestamp - Delete an event
 */
async function handleDeleteEvent(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'id');
  const timestamp = getPathParam(event, 'timestamp');
  
  await eventService.deleteEvent(batchId, timestamp, userId);
  return success({ message: 'Event deleted successfully' });
}

