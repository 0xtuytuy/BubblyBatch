import { APIGatewayProxyEventV2 } from 'aws-lambda';

export interface UserContext {
  userId: string;
  email: string;
}

/**
 * Extract user context from API Gateway JWT authorizer
 */
export function getUserContext(event: APIGatewayProxyEventV2): UserContext {
  // API Gateway JWT authorizer puts claims in requestContext.authorizer.jwt.claims
  const claims = event.requestContext?.authorizer?.jwt?.claims;

  if (!claims) {
    throw new Error('Unauthorized: No JWT claims found');
  }

  // Cognito uses 'sub' for user ID and 'email' for email
  const userId = claims.sub as string;
  const email = claims.email as string;

  if (!userId || !email) {
    throw new Error('Unauthorized: Invalid JWT claims');
  }

  return { userId, email };
}

/**
 * Validate that a user has access to a resource
 */
export function validateResourceAccess(userId: string, resourceUserId: string): void {
  if (userId !== resourceUserId) {
    throw new Error('Forbidden: You do not have access to this resource');
  }
}

