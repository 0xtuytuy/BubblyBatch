import { APIGatewayProxyEventV2 } from 'aws-lambda';
export interface UserContext {
    userId: string;
    email: string;
}
/**
 * Extract user context from API Gateway JWT authorizer
 * In offline mode, accepts X-User-Id header for testing
 */
export declare function getUserContext(event: APIGatewayProxyEventV2): UserContext;
/**
 * Validate that a user has access to a resource
 */
export declare function validateResourceAccess(userId: string, resourceUserId: string): void;
//# sourceMappingURL=auth.d.ts.map