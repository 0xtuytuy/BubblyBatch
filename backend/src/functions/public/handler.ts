import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { PublicService } from './service';
import { getPathParam, ValidationError, formatValidationErrors } from '../../utils/validation';
import { success, notFound, badRequest, error } from '../../utils/response';
import { handleError } from '../../utils/errors';

const publicService = new PublicService();

/**
 * Main handler for public batch view (no auth)
 */
export async function main(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));

    const method = event.requestContext.http.method;
    const path = event.rawPath;

    // Route to appropriate handler
    if (method === 'GET' && path.match(/^\/public\/b\/[^/]+$/)) {
      return await handleGetPublicBatch(event);
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
 * GET /public/b/:batchId - Get public batch view
 */
async function handleGetPublicBatch(
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'batchId');
  const batch = await publicService.getPublicBatch(batchId);
  return success({ batch });
}

