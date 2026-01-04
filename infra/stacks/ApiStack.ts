/**
 * API Stack
 * 
 * Sets up API Gateway HTTP API with Lambda functions for all endpoints.
 */

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

interface ApiStackProps {
  authStack: {
    userPoolId: pulumi.Output<string>;
    userPoolArn: pulumi.Output<string>;
    clientId: pulumi.Output<string>;
  };
  dataStack: {
    tableName: pulumi.Output<string>;
    tableArn: pulumi.Output<string>;
    bucketName: pulumi.Output<string>;
    bucketArn: pulumi.Output<string>;
  };
}

export default function ApiStack(props: ApiStackProps) {
  const { authStack, dataStack } = props;
  
  // Create IAM role for Lambda execution
  const lambdaRole = new aws.iam.Role("KefirLambdaRole", {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
        },
      ],
    }),
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // Attach basic Lambda execution policy
  new aws.iam.RolePolicyAttachment("KefirLambdaBasicExecution", {
    role: lambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
  });
  
  // Create policy for DynamoDB access
  const dynamoPolicy = new aws.iam.RolePolicy("KefirLambdaDynamoPolicy", {
    role: lambdaRole.id,
    policy: pulumi.all([dataStack.tableArn]).apply(([tableArn]) => JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:Query",
            "dynamodb:Scan",
            "dynamodb:BatchGetItem",
            "dynamodb:BatchWriteItem",
          ],
          Resource: [
            tableArn,
            `${tableArn}/index/*`,
          ],
        },
      ],
    })),
  });
  
  // Create policy for S3 access
  const s3Policy = new aws.iam.RolePolicy("KefirLambdaS3Policy", {
    role: lambdaRole.id,
    policy: pulumi.all([dataStack.bucketArn]).apply(([bucketArn]) => JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:ListBucket",
          ],
          Resource: [
            bucketArn,
            `${bucketArn}/*`,
          ],
        },
      ],
    })),
  });
  
  // Create policy for Cognito access
  const cognitoPolicy = new aws.iam.RolePolicy("KefirLambdaCognitoPolicy", {
    role: lambdaRole.id,
    policy: pulumi.all([authStack.userPoolArn]).apply(([userPoolArn]) => JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "cognito-idp:AdminGetUser",
            "cognito-idp:AdminCreateUser",
            "cognito-idp:AdminUpdateUserAttributes",
            "cognito-idp:ListUsers",
          ],
          Resource: userPoolArn,
        },
      ],
    })),
  });
  
  // Environment variables for Lambda functions
  const lambdaEnvironment = pulumi.all([
    dataStack.tableName,
    dataStack.bucketName,
    authStack.userPoolId,
    authStack.clientId,
  ]).apply(([tableName, bucketName, userPoolId, clientId]) => ({
    TABLE_NAME: tableName,
    BUCKET_NAME: bucketName,
    USER_POOL_ID: userPoolId,
    USER_POOL_CLIENT_ID: clientId,
    STAGE: $app.stage,
    AWS_REGION: aws.getRegionOutput().name,
  }));
  
  // Lambda function configuration defaults
  const lambdaDefaults = {
    runtime: aws.lambda.Runtime.NodeJS20dX,
    role: lambdaRole.arn,
    timeout: 30,
    memorySize: 512,
    architectures: ["arm64"],
    environment: {
      variables: lambdaEnvironment,
    },
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  };
  
  // Create Lambda functions (handlers will be in separate backend package)
  const handleAuth = new aws.lambda.Function("HandleAuth", {
    ...lambdaDefaults,
    name: `kefir-app-${$app.stage}-handleAuth`,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
      "index.js": new pulumi.asset.StringAsset(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Auth handler - to be implemented" })
          };
        };
      `),
    }),
  });
  
  const handleBatches = new aws.lambda.Function("HandleBatches", {
    ...lambdaDefaults,
    name: `kefir-app-${$app.stage}-handleBatches`,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
      "index.js": new pulumi.asset.StringAsset(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Batches handler - to be implemented" })
          };
        };
      `),
    }),
  });
  
  const handleEvents = new aws.lambda.Function("HandleEvents", {
    ...lambdaDefaults,
    name: `kefir-app-${$app.stage}-handleEvents`,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
      "index.js": new pulumi.asset.StringAsset(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Events handler - to be implemented" })
          };
        };
      `),
    }),
  });
  
  const handleReminders = new aws.lambda.Function("HandleReminders", {
    ...lambdaDefaults,
    name: `kefir-app-${$app.stage}-handleReminders`,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
      "index.js": new pulumi.asset.StringAsset(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Reminders handler - to be implemented" })
          };
        };
      `),
    }),
  });
  
  const handleDevices = new aws.lambda.Function("HandleDevices", {
    ...lambdaDefaults,
    name: `kefir-app-${$app.stage}-handleDevices`,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
      "index.js": new pulumi.asset.StringAsset(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Devices handler - to be implemented" })
          };
        };
      `),
    }),
  });
  
  const handleExport = new aws.lambda.Function("HandleExport", {
    ...lambdaDefaults,
    name: `kefir-app-${$app.stage}-handleExport`,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
      "index.js": new pulumi.asset.StringAsset(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: { "Content-Type": "text/csv" },
            body: "Export handler - to be implemented"
          };
        };
      `),
    }),
  });
  
  const handlePublic = new aws.lambda.Function("HandlePublic", {
    ...lambdaDefaults,
    name: `kefir-app-${$app.stage}-handlePublic`,
    handler: "index.handler",
    code: new pulumi.asset.AssetArchive({
      "index.js": new pulumi.asset.StringAsset(`
        exports.handler = async (event) => {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Public handler - to be implemented" })
          };
        };
      `),
    }),
  });
  
  // Create HTTP API Gateway
  const api = new aws.apigatewayv2.Api("KefirApi", {
    name: `kefir-app-${$app.stage}`,
    protocolType: "HTTP",
    corsConfiguration: {
      allowOrigins: $app.stage === "prod" 
        ? ["https://bubblebatch.com", "https://*.bubblebatch.com"]
        : ["*"],
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Authorization"],
      exposeHeaders: ["Content-Type"],
      maxAge: 300,
      allowCredentials: false,
    },
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // Create JWT authorizer for Cognito
  const authorizer = new aws.apigatewayv2.Authorizer("KefirAuthorizer", {
    apiId: api.id,
    authorizerType: "JWT",
    identitySources: ["$request.header.Authorization"],
    jwtConfiguration: {
      audiences: [authStack.clientId],
      issuer: pulumi.interpolate`https://cognito-idp.${aws.getRegionOutput().name}.amazonaws.com/${authStack.userPoolId}`,
    },
    name: "cognito-authorizer",
  });
  
  // Create API stage with throttling
  const stage = new aws.apigatewayv2.Stage("KefirApiStage", {
    apiId: api.id,
    name: "$default",
    autoDeploy: true,
    defaultRouteSettings: {
      throttlingBurstLimit: 2000,
      throttlingRateLimit: 1000,
    },
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // Helper function to create Lambda integration and route
  function createRoute(
    routeKey: string,
    lambda: aws.lambda.Function,
    useAuthorizer: boolean = true
  ) {
    const integration = new aws.apigatewayv2.Integration(`Integration-${routeKey.replace(/[\/\s]/g, "-")}`, {
      apiId: api.id,
      integrationType: "AWS_PROXY",
      integrationUri: lambda.arn,
      payloadFormatVersion: "2.0",
    });
    
    const route = new aws.apigatewayv2.Route(`Route-${routeKey.replace(/[\/\s]/g, "-")}`, {
      apiId: api.id,
      routeKey,
      target: pulumi.interpolate`integrations/${integration.id}`,
      authorizationType: useAuthorizer ? "JWT" : "NONE",
      authorizerId: useAuthorizer ? authorizer.id : undefined,
    });
    
    new aws.lambda.Permission(`Permission-${routeKey.replace(/[\/\s]/g, "-")}`, {
      action: "lambda:InvokeFunction",
      function: lambda.name,
      principal: "apigateway.amazonaws.com",
      sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
    });
    
    return { integration, route };
  }
  
  // Create routes
  // Auth routes (no authorizer)
  createRoute("POST /auth/login", handleAuth, false);
  createRoute("POST /auth/verify", handleAuth, false);
  
  // Batch routes (with authorizer)
  createRoute("POST /batches", handleBatches);
  createRoute("GET /batches", handleBatches);
  createRoute("GET /batches/{id}", handleBatches);
  
  // Event routes (with authorizer)
  createRoute("POST /batches/{id}/events", handleEvents);
  createRoute("GET /batches/{id}/events", handleEvents);
  
  // Reminder routes (with authorizer)
  createRoute("GET /batches/{id}/reminders/suggestions", handleReminders);
  createRoute("POST /batches/{id}/reminders/confirm", handleReminders);
  createRoute("GET /me/reminders", handleReminders);
  
  // Device routes (with authorizer)
  createRoute("POST /me/devices", handleDevices);
  
  // Export route (with authorizer)
  createRoute("GET /export.csv", handleExport);
  
  // Public routes (no authorizer)
  createRoute("GET /public/b/{batchId}", handlePublic, false);
  
  return {
    url: pulumi.interpolate`${api.apiEndpoint}`,
    apiId: api.id,
    api,
    functions: {
      handleAuth,
      handleBatches,
      handleEvents,
      handleReminders,
      handleDevices,
      handleExport,
      handlePublic,
    },
  };
}

