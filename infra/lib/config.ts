/**
 * Infrastructure Configuration Helper
 * 
 * Provides utilities for detecting local mode and configuring
 * appropriate endpoints for AWS services.
 */

/**
 * Check if running in local mode
 */
export function isLocalMode(): boolean {
  return $app.stage === "local";
}

/**
 * Get DynamoDB endpoint based on environment
 */
export function getDynamoDBEndpoint(): string | undefined {
  if (isLocalMode()) {
    return process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
  }
  return undefined; // Use default AWS endpoint
}

/**
 * Get S3 endpoint based on environment
 */
export function getS3Endpoint(): string | undefined {
  if (isLocalMode() && process.env.USE_LOCAL_S3 === "true") {
    return process.env.S3_ENDPOINT || "http://localhost:4566";
  }
  return undefined; // Use default AWS endpoint
}

/**
 * Get table name based on environment
 */
export function getTableName(): string {
  if (isLocalMode()) {
    return "kefir-local-table";
  }
  return `kefir-app-${$app.stage}`;
}

/**
 * Get bucket name based on environment
 */
export function getBucketName(): string {
  if (isLocalMode()) {
    return "kefir-local-photos";
  }
  return `kefir-app-photos-${$app.stage}`;
}

/**
 * Check if we should use real AWS services
 */
export function useRealAWS(service: "dynamodb" | "s3" | "cognito"): boolean {
  if (!isLocalMode()) {
    return true;
  }
  
  // In local mode, some services must use real AWS
  switch (service) {
    case "cognito":
      return true; // Always use real Cognito
    case "dynamodb":
      return process.env.USE_LOCAL_DYNAMODB !== "true";
    case "s3":
      return process.env.USE_LOCAL_S3 !== "true";
    default:
      return true;
  }
}

/**
 * Get environment variables for Lambda functions
 */
export function getLambdaEnvironment(additionalVars: Record<string, string> = {}) {
  return {
    STAGE: $app.stage,
    IS_LOCAL: isLocalMode() ? "true" : "false",
    DYNAMODB_ENDPOINT: getDynamoDBEndpoint() || "",
    S3_ENDPOINT: getS3Endpoint() || "",
    ...additionalVars,
  };
}

