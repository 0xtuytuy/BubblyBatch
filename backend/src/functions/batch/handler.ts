import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { BatchService } from './service';
import { getUserContext } from '../../lib/auth';
import { entities } from '../../lib/db';
import { CreateBatchSchema, UpdateBatchSchema, BatchFiltersSchema } from '../../models/batch';
import { parseBody, parseQuery, getPathParam, ValidationError, formatValidationErrors } from '../../utils/validation';
import { success, created, notFound, badRequest, error } from '../../utils/response';
import { handleError } from '../../utils/errors';

const batchService = new BatchService();

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
    if (method === 'POST' && path === '/batches') {
      return await handleCreateBatch(event, userId);
    } else if (method === 'GET' && path === '/batches') {
      return await handleListBatches(event, userId);
    } else if (method === 'GET' && path.match(/^\/batches\/[^/]+$/)) {
      return await handleGetBatch(event, userId);
    } else if (method === 'PUT' && path.match(/^\/batches\/[^/]+$/)) {
      return await handleUpdateBatch(event, userId);
    } else if (method === 'DELETE' && path.match(/^\/batches\/[^/]+$/)) {
      return await handleDeleteBatch(event, userId);
    } else if (method === 'POST' && path.match(/^\/batches\/[^/]+\/photo\/upload-url$/)) {
      return await handleGetPhotoUploadUrl(event, userId);
    } else if (method === 'POST' && path.match(/^\/batches\/[^/]+\/photo$/)) {
      return await handleAddPhoto(event, userId);
    } else if (method === 'GET' && path.match(/^\/batches\/[^/]+\/photos$/)) {
      return await handleGetPhotos(event, userId);
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
 * POST /batches - Create a new batch
 */
async function handleCreateBatch(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const input = parseBody(event, CreateBatchSchema);
  const batch = await batchService.createBatch(userId, input);
  return created({ batch });
}

/**
 * GET /batches - List all batches for user
 */
async function handleListBatches(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const filters = parseQuery(event, BatchFiltersSchema.partial());
  const batches = await batchService.getUserBatches(userId, filters);
  return success({ batches, count: batches.length });
}

/**
 * GET /batches/:id - Get a single batch
 */
async function handleGetBatch(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'id');
  const batch = await batchService.getBatch(batchId, userId);
  return success({ batch });
}

/**
 * PUT /batches/:id - Update a batch
 */
async function handleUpdateBatch(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'id');
  const updates = parseBody(event, UpdateBatchSchema);
  const batch = await batchService.updateBatch(batchId, userId, updates);
  return success({ batch });
}

/**
 * DELETE /batches/:id - Delete (archive) a batch
 */
async function handleDeleteBatch(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'id');
  await batchService.deleteBatch(batchId, userId);
  return success({ message: 'Batch archived successfully' });
}

/**
 * POST /batches/:id/photo/upload-url - Get presigned URL for photo upload
 */
async function handleGetPhotoUploadUrl(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'id');
  const body = JSON.parse(event.body || '{}');
  const filename = body.filename || 'photo.jpg';
  const contentType = body.contentType || 'image/jpeg';

  const result = await batchService.getPhotoUploadUrl(batchId, userId, filename, contentType);
  return success(result);
}

/**
 * POST /batches/:id/photo - Add photo key to batch after upload
 */
async function handleAddPhoto(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'id');
  const body = JSON.parse(event.body || '{}');
  const photoKey = body.photoKey;

  if (!photoKey) {
    return badRequest('photoKey is required');
  }

  const batch = await batchService.addPhotoToBatch(batchId, userId, photoKey);
  return success({ batch });
}

/**
 * GET /batches/:id/photos - Get photo download URLs
 */
async function handleGetPhotos(
  event: APIGatewayProxyEventV2,
  userId: string
): Promise<APIGatewayProxyResultV2> {
  const batchId = getPathParam(event, 'id');
  const urls = await batchService.getBatchPhotoUrls(batchId, userId);
  return success({ photoUrls: urls });
}

