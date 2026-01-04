import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ReminderService } from './service';
import { getUserContext } from '../../lib/auth';
import { entities } from '../../lib/db';
import { ConfirmReminderSchema } from '../../models/reminder';
import { parseBody, getPathParam, ValidationError, formatValidationErrors } from '../../utils/validation';
import { success, created, notFound, badRequest, error } from '../../utils/response';
import { handleError } from '../../utils/errors';

const reminderService = new ReminderService();

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
    if (method === 'GET' && path.match(/^\/batches\/[^/]+\/reminders\/suggestions$/)) {
      return await handleGetSuggestions(event, userId);
    } else if (method === 'POST' && path.match(/^\/batches\/[^/]+\/reminders\/confirm$/)) {
      return await handleConfirmReminders(event, userId);
    } else if (method === 'GET' && path === '/me/reminders') {
      return await handleListReminders(event, userId);
    } else if (method === 'DELETE' && path.match(/^\/me\/reminders\/[^/]+$/)) {
      return await handleCancelReminder(event, userId);
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
 * GET /batches/:id/reminders/suggestions - Get reminder suggestions
 */
async function handleGetSuggestions(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'id');
  const suggestions = await reminderService.getReminderSuggestions(batchId, userId);
  return success({ suggestions });
}

/**
 * POST /batches/:id/reminders/confirm - Confirm and schedule reminders
 */
async function handleConfirmReminders(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'id');
  const input = parseBody(event, ConfirmReminderSchema);
  const reminders = await reminderService.confirmReminders(batchId, userId, input);
  return created({ reminders, count: reminders.length });
}

/**
 * GET /me/reminders - List all reminders for user
 */
async function handleListReminders(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const reminders = await reminderService.getUserReminders(userId);
  
  // Filter out past reminders by default unless includeAll is set
  const includeAll = event.queryStringParameters?.includeAll === 'true';
  const now = new Date();
  
  let filteredReminders = reminders;
  if (!includeAll) {
    filteredReminders = reminders.filter(
      (r) => r.status === 'pending' && new Date(r.scheduledTime) > now
    );
  }

  return success({ reminders: filteredReminders, count: filteredReminders.length });
}

/**
 * DELETE /me/reminders/:id - Cancel a reminder
 */
async function handleCancelReminder(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const reminderId = getPathParam(event, 'id');
  await reminderService.cancelReminder(reminderId, userId);
  return success({ message: 'Reminder cancelled successfully' });
}

