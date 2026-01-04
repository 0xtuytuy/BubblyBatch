import { z } from 'zod';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

export class ValidationError extends Error {
  constructor(public errors: z.ZodError) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

/**
 * Parse and validate request body
 */
export function parseBody<T>(
  event: APIGatewayProxyEventV2,
  schema: z.ZodSchema<T>
): T {
  if (!event.body) {
    throw new ValidationError(
      new z.ZodError([
        {
          code: 'custom',
          path: ['body'],
          message: 'Request body is required',
        },
      ])
    );
  }

  let body: any;
  try {
    body = JSON.parse(event.body);
  } catch {
    throw new ValidationError(
      new z.ZodError([
        {
          code: 'custom',
          path: ['body'],
          message: 'Invalid JSON in request body',
        },
      ])
    );
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
export function parseQuery<T>(
  event: APIGatewayProxyEventV2,
  schema: z.ZodSchema<T>
): T {
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
export function getPathParam(
  event: APIGatewayProxyEventV2,
  name: string
): string {
  const value = event.pathParameters?.[name];
  if (!value) {
    throw new ValidationError(
      new z.ZodError([
        {
          code: 'custom',
          path: [name],
          message: `Path parameter '${name}' is required`,
        },
      ])
    );
  }
  return value;
}

/**
 * Format validation errors for response
 */
export function formatValidationErrors(error: z.ZodError): any {
  return {
    message: 'Validation failed',
    errors: error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  };
}

