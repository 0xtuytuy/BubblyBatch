"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.main = main;
const service_1 = require("./service");
const auth_1 = require("../../lib/auth");
const db_1 = require("../../lib/db");
const validation_1 = require("../../utils/validation");
const response_1 = require("../../utils/response");
const errors_1 = require("../../utils/errors");
const exportService = new service_1.ExportService();
/**
 * Main handler for CSV export
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
        if (method === 'GET' && path === '/export.csv') {
            return await handleExportCSV(userId);
        }
        return {
            statusCode: 404,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ error: 'Route not found' }),
        };
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
 * GET /export.csv - Export all user data as CSV
 */
async function handleExportCSV(userId) {
    const csv = await exportService.exportUserData(userId);
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="kefir-data-${Date.now()}.csv"`,
        },
        body: csv,
    };
}
//# sourceMappingURL=handler.js.map