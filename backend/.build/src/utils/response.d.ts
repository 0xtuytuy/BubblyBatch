import { APIGatewayProxyResultV2 } from 'aws-lambda';
export declare function success(data: any, statusCode?: number): APIGatewayProxyResultV2;
export declare function error(message: string, statusCode?: number): APIGatewayProxyResultV2;
export declare function badRequest(message: string): APIGatewayProxyResultV2;
export declare function unauthorized(message?: string): APIGatewayProxyResultV2;
export declare function forbidden(message?: string): APIGatewayProxyResultV2;
export declare function notFound(message?: string): APIGatewayProxyResultV2;
export declare function created(data: any): APIGatewayProxyResultV2;
//# sourceMappingURL=response.d.ts.map