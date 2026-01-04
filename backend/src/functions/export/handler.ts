import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { ExportService } from './service';
import { getUserContext } from '../../lib/auth';
import { entities } from '../../lib/db';
import { ValidationError, formatValidationErrors } from '../../utils/validation';
import { badRequest, error } from '../../utils/response';
import { handleError } from '../../utils/errors';

const exportService = new ExportService();

/**
 * Main handler for CSV export
 */
export async function main(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));

    const { userId, email } = getUserContext(event);
    
    // Ensure user exists in database
    await entities.getOrCreateUser(userId, email);

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
  } catch (err: any) {
    console.error('Error:', err);

    if (err instanceof ValidationError) {
      return badRequest(JSON.stringify(formatValidationErrors(err.errors)));
    }

    const { statusCode, message } = handleError(err);
    return error(message, statusCode);
  }
}

/**
 * GET /export.csv - Export all user data as CSV
 */
async function handleExportCSV(userId: string): Promise<APIGatewayProxyResultV2> {
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

