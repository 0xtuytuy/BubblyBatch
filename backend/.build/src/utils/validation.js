"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
exports.parseBody = parseBody;
exports.parseQuery = parseQuery;
exports.getPathParam = getPathParam;
exports.formatValidationErrors = formatValidationErrors;
const zod_1 = require("zod");
class ValidationError extends Error {
    constructor(errors) {
        super('Validation failed');
        this.errors = errors;
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
/**
 * Parse and validate request body
 */
function parseBody(event, schema) {
    if (!event.body) {
        throw new ValidationError(new zod_1.z.ZodError([
            {
                code: 'custom',
                path: ['body'],
                message: 'Request body is required',
            },
        ]));
    }
    let body;
    try {
        body = JSON.parse(event.body);
    }
    catch {
        throw new ValidationError(new zod_1.z.ZodError([
            {
                code: 'custom',
                path: ['body'],
                message: 'Invalid JSON in request body',
            },
        ]));
    }
    const result = schema.safeParse(body);
    if (!result.success) {
        throw new ValidationError(result.error);
    }
    return result.data;
}
/**
 * Parse and validate query parameters
 */
function parseQuery(event, schema) {
    const query = event.queryStringParameters || {};
    const result = schema.safeParse(query);
    if (!result.success) {
        throw new ValidationError(result.error);
    }
    return result.data;
}
/**
 * Get path parameter or throw error
 */
function getPathParam(event, name) {
    const value = event.pathParameters?.[name];
    if (!value) {
        throw new ValidationError(new zod_1.z.ZodError([
            {
                code: 'custom',
                path: [name],
                message: `Path parameter '${name}' is required`,
            },
        ]));
    }
    return value;
}
/**
 * Format validation errors for response
 */
function formatValidationErrors(error) {
    return {
        message: 'Validation failed',
        errors: error.errors.map((err) => ({
            path: err.path.join('.'),
            message: err.message,
        })),
    };
}
//# sourceMappingURL=validation.js.map