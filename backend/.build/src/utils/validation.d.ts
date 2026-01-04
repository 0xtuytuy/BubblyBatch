import { z } from 'zod';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
export declare class ValidationError extends Error {
    errors: z.ZodError;
    constructor(errors: z.ZodError);
}
/**
 * Parse and validate request body
 */
export declare function parseBody<T>(event: APIGatewayProxyEventV2, schema: z.ZodSchema<T>): T;
/**
 * Parse and validate query parameters
 */
export declare function parseQuery<T>(event: APIGatewayProxyEventV2, schema: z.ZodSchema<T>): T;
/**
 * Get path parameter or throw error
 */
export declare function getPathParam(event: APIGatewayProxyEventV2, name: string): string;
/**
 * Format validation errors for response
 */
export declare function formatValidationErrors(error: z.ZodError): any;
//# sourceMappingURL=validation.d.ts.map