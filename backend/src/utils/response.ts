import { APIGatewayProxyResultV2 } from 'aws-lambda';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Methods': '*',
  'Content-Type': 'application/json',
};

export function success(data: any, statusCode: number = 200): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(data),
  };
}

export function error(message: string, statusCode: number = 500): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({ error: message }),
  };
}

export function badRequest(message: string): APIGatewayProxyResultV2 {
  return error(message, 400);
}

export function unauthorized(message: string = 'Unauthorized'): APIGatewayProxyResultV2 {
  return error(message, 401);
}

export function forbidden(message: string = 'Forbidden'): APIGatewayProxyResultV2 {
  return error(message, 403);
}

export function notFound(message: string = 'Not found'): APIGatewayProxyResultV2 {
  return error(message, 404);
}

export function created(data: any): APIGatewayProxyResultV2 {
  return success(data, 201);
}

