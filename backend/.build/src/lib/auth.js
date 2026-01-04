"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserContext = getUserContext;
exports.validateResourceAccess = validateResourceAccess;
const IS_OFFLINE = process.env.IS_OFFLINE === 'true';
/**
 * Extract user context from API Gateway JWT authorizer
 * In offline mode, accepts X-User-Id header for testing
 */
function getUserContext(event) {
    // Offline mode: use X-User-Id header for testing
    if (IS_OFFLINE) {
        const userId = event.headers?.['x-user-id'] || event.headers?.['X-User-Id'];
        if (!userId) {
            // Default to test user if no header provided
            console.warn('[OFFLINE] No X-User-Id header, using test-user-1');
            return {
                userId: 'test-user-1',
                email: 'alice@example.com',
            };
        }
        // Generate test email based on userId
        const email = `${userId}@example.com`;
        console.log(`[OFFLINE] Using test user: ${userId} (${email})`);
        return { userId, email };
    }
    // Production mode: use Cognito JWT claims
    const authorizer = event.requestContext?.authorizer;
    const claims = authorizer?.jwt?.claims;
    if (!claims) {
        throw new Error('Unauthorized: No JWT claims found');
    }
    // Cognito uses 'sub' for user ID and 'email' for email
    const userId = claims.sub;
    const email = claims.email;
    if (!userId || !email) {
        throw new Error('Unauthorized: Invalid JWT claims');
    }
    return { userId, email };
}
/**
 * Validate that a user has access to a resource
 */
function validateResourceAccess(userId, resourceUserId) {
    if (userId !== resourceUserId) {
        throw new Error('Forbidden: You do not have access to this resource');
    }
}
//# sourceMappingURL=auth.js.map