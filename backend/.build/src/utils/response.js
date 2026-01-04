"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.success = success;
exports.error = error;
exports.badRequest = badRequest;
exports.unauthorized = unauthorized;
exports.forbidden = forbidden;
exports.notFound = notFound;
exports.created = created;
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': '*',
    'Content-Type': 'application/json',
};
function success(data, statusCode = 200) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify(data),
    };
}
function error(message, statusCode = 500) {
    return {
        statusCode,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: message }),
    };
}
function badRequest(message) {
    return error(message, 400);
}
function unauthorized(message = 'Unauthorized') {
    return error(message, 401);
}
function forbidden(message = 'Forbidden') {
    return error(message, 403);
}
function notFound(message = 'Not found') {
    return error(message, 404);
}
function created(data) {
    return success(data, 201);
}
//# sourceMappingURL=response.js.map