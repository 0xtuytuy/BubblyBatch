"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const service_1 = require("./service");
const validation_1 = require("../../utils/validation");
const response_1 = require("../../utils/response");
const errors_1 = require("../../utils/errors");
const publicService = new service_1.PublicService();
/**
 * Main handler for public batch view (no auth)
 */
async function main(event) {
    try {
        console.log('Event:', JSON.stringify(event, null, 2));
        const method = event.requestContext.http.method;
        const path = event.rawPath;
        // Route to appropriate handler
        if (method === 'GET' && path.match(/^\/public\/b\/[^/]+$/)) {
            return await handleGetPublicBatch(event);
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
 * GET /public/b/:batchId - Get public batch view
 */
async function handleGetPublicBatch(event) {
    const batchId = (0, validation_1.getPathParam)(event, 'batchId');
    const batch = await publicService.getPublicBatch(batchId);
    return (0, response_1.success)({ batch });
}
//# sourceMappingURL=handler.js.map