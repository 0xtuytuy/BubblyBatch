"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const service_1 = require("./service");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
const batch_1 = require("../../models/batch");
const validation_1 = require("../../utils/validation");
const response_1 = require("../../utils/response");
const errors_1 = require("../../utils/errors");
const batchService = new service_1.BatchService();
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
        if (method === 'POST' && path === '/batches') {
            return await handleCreateBatch(event, userId);
        }
        else if (method === 'GET' && path === '/batches') {
            return await handleListBatches(event, userId);
        }
        else if (method === 'GET' && path.match(/^\/batches\/[^/]+$/)) {
            return await handleGetBatch(event, userId);
        }
        else if (method === 'PUT' && path.match(/^\/batches\/[^/]+$/)) {
            return await handleUpdateBatch(event, userId);
        }
        else if (method === 'DELETE' && path.match(/^\/batches\/[^/]+$/)) {
            return await handleDeleteBatch(event, userId);
        }
        else if (method === 'POST' && path.match(/^\/batches\/[^/]+\/photo\/upload-url$/)) {
            return await handleGetPhotoUploadUrl(event, userId);
        }
        else if (method === 'POST' && path.match(/^\/batches\/[^/]+\/photo$/)) {
            return await handleAddPhoto(event, userId);
        }
        else if (method === 'GET' && path.match(/^\/batches\/[^/]+\/photos$/)) {
            return await handleGetPhotos(event, userId);
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
 * POST /batches - Create a new batch
 */
async function handleCreateBatch(event, userId) {
    const input = (0, validation_1.parseBody)(event, batch_1.CreateBatchSchema);
    const batch = await batchService.createBatch(userId, input);
    return (0, response_1.created)({ batch });
}
/**
 * GET /batches - List all batches for user
 */
async function handleListBatches(event, userId) {
    const filters = (0, validation_1.parseQuery)(event, batch_1.BatchFiltersSchema.partial());
    const batches = await batchService.getUserBatches(userId, filters);
    return (0, response_1.success)({ batches, count: batches.length });
}
/**
 * GET /batches/:id - Get a single batch
 */
async function handleGetBatch(event, userId) {
    const batchId = (0, validation_1.getPathParam)(event, 'id');
    const batch = await batchService.getBatch(batchId, userId);
    return (0, response_1.success)({ batch });
}
/**
 * PUT /batches/:id - Update a batch
 */
async function handleUpdateBatch(event, userId) {
    const batchId = (0, validation_1.getPathParam)(event, 'id');
    const updates = (0, validation_1.parseBody)(event, batch_1.UpdateBatchSchema);
    const batch = await batchService.updateBatch(batchId, userId, updates);
    return (0, response_1.success)({ batch });
}
/**
 * DELETE /batches/:id - Delete (archive) a batch
 */
async function handleDeleteBatch(event, userId) {
    const batchId = (0, validation_1.getPathParam)(event, 'id');
    await batchService.deleteBatch(batchId, userId);
    return (0, response_1.success)({ message: 'Batch archived successfully' });
}
/**
 * POST /batches/:id/photo/upload-url - Get presigned URL for photo upload
 */
async function handleGetPhotoUploadUrl(event, userId) {
    const batchId = (0, validation_1.getPathParam)(event, 'id');
    const body = JSON.parse(event.body || '{}');
    const filename = body.filename || 'photo.jpg';
    const contentType = body.contentType || 'image/jpeg';
    const result = await batchService.getPhotoUploadUrl(batchId, userId, filename, contentType);
    return (0, response_1.success)(result);
}
/**
 * POST /batches/:id/photo - Add photo key to batch after upload
 */
async function handleAddPhoto(event, userId) {
    const batchId = (0, validation_1.getPathParam)(event, 'id');
    const body = JSON.parse(event.body || '{}');
    const photoKey = body.photoKey;
    if (!photoKey) {
        return (0, response_1.badRequest)('photoKey is required');
    }
    const batch = await batchService.addPhotoToBatch(batchId, userId, photoKey);
    return (0, response_1.success)({ batch });
}
/**
 * GET /batches/:id/photos - Get photo download URLs
 */
async function handleGetPhotos(event, userId) {
    const batchId = (0, validation_1.getPathParam)(event, 'id');
    const urls = await batchService.getBatchPhotoUrls(batchId, userId);
    return (0, response_1.success)({ photoUrls: urls });
}
//# sourceMappingURL=handler.js.map