# Infrastructure Development Rules

> Guidelines for working with SST infrastructure code (Pulumi)

## 🏗️ Architecture Overview

### Technology Stack

| Technology | Purpose |
|------------|---------|
| SST (Ion) | Infrastructure framework |
| Pulumi | Infrastructure as Code engine |
| AWS Lambda | Serverless compute |
| DynamoDB | NoSQL database (single-table design) |
| S3 | Photo storage |
| Cognito | Authentication |
| API Gateway v2 | HTTP API |
| EventBridge Scheduler | Reminder scheduling |
| CloudWatch | Logging and monitoring |

### Project Structure

```
infra/
├── sst.config.ts         # SST configuration
├── stacks/               # Infrastructure stacks
│   ├── ApiStack.ts       # API Gateway + Lambda functions
│   ├── AuthStack.ts      # Cognito User Pool
│   ├── DataStack.ts      # DynamoDB + S3
│   ├── SchedulerStack.ts # EventBridge Scheduler
│   └── MonitoringStack.ts # CloudWatch (future)
├── scripts/              # Helper scripts
│   ├── init.sh          # Environment setup
│   └── seed-dev.ts      # Seed dev data
└── ARCHITECTURE.md       # Architecture documentation
```

## 🎯 Stack Organization Pattern

### Stack File Structure

Each stack follows this pattern:

```typescript
/**
 * Stack Name
 * 
 * Brief description of what this stack provides
 */

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

interface StackNameProps {
  // Dependencies from other stacks
  otherStack: {
    outputName: pulumi.Output<string>;
  };
}

export default function StackName(props?: StackNameProps) {
  // 1. Create resources
  const resource = new aws.service.Resource("ResourceName", {
    // Configuration
  });
  
  // 2. Return outputs for other stacks
  return {
    outputName: resource.property,
    resource,  // Include full resource if needed
  };
}
```

### Stack Dependencies

Stacks pass outputs to dependent stacks via props:

```typescript
// sst.config.ts
export default $config({
  app(input) {
    return {
      name: "kefir-app",
      stage: input?.stage || "dev",
    };
  },
  async run() {
    // Order matters - dependencies first
    const authStack = await import("./stacks/AuthStack");
    const auth = authStack.default();
    
    const dataStack = await import("./stacks/DataStack");
    const data = dataStack.default();
    
    const apiStack = await import("./stacks/ApiStack");
    const api = apiStack.default({ authStack: auth, dataStack: data });
    
    return {
      apiUrl: api.url,
      userPoolId: auth.userPoolId,
      tableName: data.tableName,
    };
  },
});
```

## 🔐 IAM Roles & Policies

### Least Privilege Principle

Always grant minimum required permissions:

```typescript
// Create role for Lambda
const lambdaRole = new aws.iam.Role("KefirLambdaRole", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: { Service: "lambda.amazonaws.com" },
    }],
  }),
});

// Attach basic Lambda execution (CloudWatch Logs)
new aws.iam.RolePolicyAttachment("KefirLambdaBasicExecution", {
  role: lambdaRole.name,
  policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
});

// Create inline policy for DynamoDB access
new aws.iam.RolePolicy("KefirLambdaDynamoPolicy", {
  role: lambdaRole.id,
  policy: pulumi.all([dataStack.tableArn]).apply(([tableArn]) => 
    JSON.stringify({
      Version: "2012-10-17",
      Statement: [{
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
          `${tableArn}/index/*`,  // Include GSI permissions
        ],
      }],
    })
  ),
});
```

**Key Patterns:**
- Use managed policies for standard permissions (`AWSLambdaBasicExecutionRole`)
- Create inline policies for resource-specific access
- Use `pulumi.all()` to combine multiple outputs
- Always include index permissions for DynamoDB GSIs
- Scope permissions to specific resources (no `Resource: "*"`)

## 🗄️ DynamoDB Configuration

### Single-Table Design

```typescript
const table = new aws.dynamodb.Table("KefirTable", {
  name: `kefir-app-${$app.stage}`,
  billingMode: "PAY_PER_REQUEST",  // On-demand for variable load
  hashKey: "PK",
  rangeKey: "SK",
  
  attributes: [
    { name: "PK", type: "S" },
    { name: "SK", type: "S" },
    { name: "GSI1PK", type: "S" },
    { name: "GSI1SK", type: "S" },
  ],
  
  globalSecondaryIndexes: [{
    name: "GSI1",
    hashKey: "GSI1PK",
    rangeKey: "GSI1SK",
    projectionType: "ALL",  // Include all attributes
  }],
  
  // Production features
  pointInTimeRecovery: {
    enabled: $app.stage === "prod",
  },
  
  deletionProtectionEnabled: $app.stage === "prod",
  
  // Encryption at rest (always on)
  serverSideEncryption: {
    enabled: true,
  },
  
  // TTL for auto-expiring items
  ttl: {
    enabled: true,
    attributeName: "TTL",
  },
  
  tags: {
    Environment: $app.stage,
    Application: "kefir-app",
  },
});
```

**Best Practices:**
- Use `PAY_PER_REQUEST` for unpredictable workloads
- Enable point-in-time recovery in production
- Always enable server-side encryption
- Use TTL for temporary data (sessions, cache)
- Enable deletion protection in production
- Use stage-aware naming

## 📦 S3 Bucket Configuration

### Secure Photo Storage

```typescript
const bucket = new aws.s3.BucketV2("KefirPhotoBucket", {
  bucket: `kefir-app-photos-${$app.stage}-${aws.getCallerIdentityOutput().accountId}`,
  tags: {
    Environment: $app.stage,
    Application: "kefir-app",
  },
});

// Versioning (production only)
new aws.s3.BucketVersioningV2("KefirPhotoBucketVersioning", {
  bucket: bucket.id,
  versioningConfiguration: {
    status: $app.stage === "prod" ? "Enabled" : "Suspended",
  },
});

// Block ALL public access
new aws.s3.BucketPublicAccessBlock("KefirPhotoBucketPublicAccessBlock", {
  bucket: bucket.id,
  blockPublicAcls: true,
  blockPublicPolicy: true,
  ignorePublicAcls: true,
  restrictPublicBuckets: true,
});

// Encryption at rest
new aws.s3.BucketServerSideEncryptionConfigurationV2("KefirPhotoBucketEncryption", {
  bucket: bucket.id,
  rules: [{
    applyServerSideEncryptionByDefault: {
      sseAlgorithm: "AES256",
    },
    bucketKeyEnabled: true,
  }],
});

// CORS for presigned URLs
new aws.s3.BucketCorsConfigurationV2("KefirPhotoBucketCors", {
  bucket: bucket.id,
  corsRules: [{
    allowedHeaders: ["*"],
    allowedMethods: ["GET", "PUT", "POST"],
    allowedOrigins: $app.stage === "prod" 
      ? ["https://kefirproducer.com", "https://*.kefirproducer.com"]
      : ["*"],
    exposeHeaders: ["ETag"],
    maxAgeSeconds: 3000,
  }],
});

// Lifecycle policies
new aws.s3.BucketLifecycleConfigurationV2("KefirPhotoBucketLifecycle", {
  bucket: bucket.id,
  rules: [
    {
      id: "delete-old-photos",
      status: "Enabled",
      expiration: { days: 365 },
    },
    {
      id: "abort-incomplete-uploads",
      status: "Enabled",
      abortIncompleteMultipartUpload: {
        daysAfterInitiation: 7,
      },
    },
  ],
});
```

**Security Checklist:**
- ✅ Block all public access by default
- ✅ Enable encryption at rest (AES256)
- ✅ Configure CORS only for app domains
- ✅ Use versioning in production
- ✅ Set lifecycle policies to control costs
- ✅ Include AWS account ID in bucket name (global uniqueness)

## 🚀 Lambda Function Configuration

### Standard Configuration

```typescript
const lambdaDefaults = {
  runtime: aws.lambda.Runtime.NodeJS20dX,
  role: lambdaRole.arn,
  timeout: 30,
  memorySize: 512,
  architectures: ["arm64"],  // Graviton2 - better performance/cost
  environment: {
    variables: lambdaEnvironment,
  },
  tags: {
    Environment: $app.stage,
    Application: "kefir-app",
  },
};

const handleBatches = new aws.lambda.Function("HandleBatches", {
  ...lambdaDefaults,
  name: `kefir-app-${$app.stage}-handleBatches`,
  handler: "src/functions/batch/handler.main",
  code: new pulumi.asset.FileArchive("../backend/dist"),
});
```

**Configuration Notes:**
- Use Node.js 20.x runtime (latest stable)
- Use ARM64 architecture (Graviton2) for cost savings
- Default timeout: 30 seconds (adjust based on function)
- Default memory: 512 MB (monitor and adjust)
- Consistent naming: `{app}-{stage}-{function}`

### Environment Variables

```typescript
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
```

Use `pulumi.all()` to combine multiple outputs into environment variables.

## 🌐 API Gateway Configuration

### HTTP API (v2)

```typescript
const api = new aws.apigatewayv2.Api("KefirApi", {
  name: `kefir-app-${$app.stage}`,
  protocolType: "HTTP",  // Use HTTP API (cheaper, faster than REST)
  
  corsConfiguration: {
    allowOrigins: $app.stage === "prod" 
      ? ["https://kefirproducer.com", "https://*.kefirproducer.com"]
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

// JWT Authorizer for Cognito
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

// Auto-deploy stage with throttling
const stage = new aws.apigatewayv2.Stage("KefirApiStage", {
  apiId: api.id,
  name: "$default",
  autoDeploy: true,
  defaultRouteSettings: {
    throttlingBurstLimit: 2000,
    throttlingRateLimit: 1000,
  },
});
```

**Key Features:**
- HTTP API (not REST API) - simpler, cheaper
- JWT authorizer for Cognito tokens
- CORS configured for app domains
- Throttling to prevent abuse
- Auto-deploy for convenience

### Route Creation Pattern

```typescript
function createRoute(
  routeKey: string,
  lambda: aws.lambda.Function,
  useAuthorizer: boolean = true
) {
  // Create Lambda integration
  const integration = new aws.apigatewayv2.Integration(
    `Integration-${routeKey.replace(/[\/\s]/g, "-")}`,
    {
      apiId: api.id,
      integrationType: "AWS_PROXY",
      integrationUri: lambda.arn,
      payloadFormatVersion: "2.0",  // Use v2 format
    }
  );
  
  // Create route
  const route = new aws.apigatewayv2.Route(
    `Route-${routeKey.replace(/[\/\s]/g, "-")}`,
    {
      apiId: api.id,
      routeKey,
      target: pulumi.interpolate`integrations/${integration.id}`,
      authorizationType: useAuthorizer ? "JWT" : "NONE",
      authorizerId: useAuthorizer ? authorizer.id : undefined,
    }
  );
  
  // Grant API Gateway permission to invoke Lambda
  new aws.lambda.Permission(
    `Permission-${routeKey.replace(/[\/\s]/g, "-")}`,
    {
      action: "lambda:InvokeFunction",
      function: lambda.name,
      principal: "apigateway.amazonaws.com",
      sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
    }
  );
  
  return { integration, route };
}

// Usage
createRoute("POST /batches", handleBatches);  // With auth
createRoute("GET /public/b/{batchId}", handlePublic, false);  // No auth
```

## 🔐 Cognito User Pool

### Email OTP Configuration

```typescript
const userPool = new aws.cognito.UserPool("KefirUserPool", {
  name: `kefir-app-${$app.stage}`,
  
  // Email as username
  usernameAttributes: ["email"],
  autoVerifiedAttributes: ["email"],
  
  // Email OTP configuration
  mfaConfiguration: "OPTIONAL",
  
  accountRecoverySetting: {
    recoveryMechanisms: [{
      name: "verified_email",
      priority: 1,
    }],
  },
  
  // Password policy (not used for OTP, but required)
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
    requireUppercase: false,
  },
  
  // Email configuration
  emailConfiguration: {
    emailSendingAccount: "COGNITO_DEFAULT",
  },
  
  // User attributes
  schemas: [{
    name: "email",
    attributeDataType: "String",
    required: true,
    mutable: false,
  }],
  
  tags: {
    Environment: $app.stage,
    Application: "kefir-app",
  },
});

// App client for mobile app
const userPoolClient = new aws.cognito.UserPoolClient("KefirUserPoolClient", {
  name: `kefir-app-${$app.stage}-client`,
  userPoolId: userPool.id,
  
  // Auth flows
  explicitAuthFlows: [
    "ALLOW_CUSTOM_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
  ],
  
  // Token validity
  accessTokenValidity: 1,  // 1 hour
  idTokenValidity: 1,
  refreshTokenValidity: 30,  // 30 days
  tokenValidityUnits: {
    accessToken: "hours",
    idToken: "hours",
    refreshToken: "days",
  },
  
  // Disable client secret (public mobile app)
  generateSecret: false,
  
  preventUserExistenceErrors: "ENABLED",
});
```

## ⏰ EventBridge Scheduler (Future)

### Reminder Scheduling Pattern

```typescript
// Create IAM role for EventBridge Scheduler
const schedulerRole = new aws.iam.Role("KefirSchedulerRole", {
  assumeRolePolicy: JSON.stringify({
    Version: "2012-10-17",
    Statement: [{
      Action: "sts:AssumeRole",
      Effect: "Allow",
      Principal: { Service: "scheduler.amazonaws.com" },
    }],
  }),
});

// Grant permission to invoke Lambda
new aws.iam.RolePolicy("KefirSchedulerLambdaPolicy", {
  role: schedulerRole.id,
  policy: pulumi.interpolate`{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": "lambda:InvokeFunction",
      "Resource": "${reminderLambda.arn}"
    }]
  }`,
});
```

## 🏷️ Resource Naming Conventions

### Naming Pattern

```
{app}-{stage}-{resource-type}
```

Examples:
- `kefir-app-dev-handleBatches` (Lambda)
- `kefir-app-prod-photos-bucket` (S3)
- `kefir-app-dev` (DynamoDB table)

**Rules:**
- Use kebab-case for names
- Include stage for all resources
- Be descriptive but concise
- Lowercase only for bucket names
- Use consistent app name across all resources

### Pulumi Resource Names

```typescript
// Pulumi resource name (internal, PascalCase)
new aws.s3.BucketV2("KefirPhotoBucket", {
  // AWS resource name (external, kebab-case)
  bucket: `kefir-app-photos-${$app.stage}-${accountId}`,
});
```

## 🏷️ Tagging Strategy

**Required tags for all resources:**

```typescript
tags: {
  Environment: $app.stage,      // 'dev' | 'prod'
  Application: "kefir-app",     // Project name
}
```

Optional tags:
- `Owner` - Team or person responsible
- `CostCenter` - For cost allocation
- `ManagedBy` - "SST" or "Pulumi"

## 🔍 CloudWatch Logging

### Lambda Logs

Logs are automatically created by `AWSLambdaBasicExecutionRole`:

```typescript
// Log group is created automatically as:
// /aws/lambda/{function-name}

// Set retention (future enhancement)
new aws.cloudwatch.LogGroup("KefirBatchesLogGroup", {
  name: `/aws/lambda/${handleBatches.name}`,
  retentionInDays: $app.stage === "prod" ? 30 : 14,
});
```

### Structured Logging in Lambda

Lambda functions should log structured JSON:

```typescript
console.log(JSON.stringify({
  level: 'info',
  userId,
  action: 'createBatch',
  batchId,
  timestamp: new Date().toISOString(),
}));
```

## 🎯 Environment-Specific Configuration

### Stage-Aware Resources

```typescript
// Production features
pointInTimeRecovery: {
  enabled: $app.stage === "prod",
},

deletionProtectionEnabled: $app.stage === "prod",

// CORS - restrictive in prod, permissive in dev
allowOrigins: $app.stage === "prod" 
  ? ["https://kefirproducer.com"]
  : ["*"],

// Log retention - longer in prod
retentionInDays: $app.stage === "prod" ? 30 : 14,
```

**Production-only features:**
- Point-in-time recovery (DynamoDB)
- Versioning (S3)
- Deletion protection
- Stricter CORS
- Longer log retention
- Alarms and monitoring

## 🚀 Deployment Commands

```bash
# Install dependencies
npm install

# Deploy to development
sst deploy --stage dev

# Deploy to production
sst deploy --stage prod

# Remove stack
sst remove --stage dev

# Run SST console (local dashboard)
sst dev
```

## 💰 Cost Optimization

**Strategies:**
- Use on-demand billing for unpredictable workloads
- ARM64 Lambda architecture (Graviton2)
- S3 lifecycle policies to delete old data
- CloudWatch log retention limits
- HTTP API instead of REST API
- Avoid NAT gateways (use public Lambda when possible)

## 🔒 Security Best Practices

### Infrastructure Security

1. **IAM Least Privilege**
   - Grant only required permissions
   - Use resource-specific ARNs (not `*`)
   - Separate roles for each service

2. **Network Security**
   - Block S3 public access
   - Restrict API CORS to app domains
   - Use VPC endpoints if needed (future)

3. **Data Security**
   - Enable encryption at rest (DynamoDB, S3)
   - Use HTTPS/TLS for all endpoints
   - Enable versioning and backups in production

4. **Secrets Management**
   - Use AWS Secrets Manager or Parameter Store
   - Never hardcode credentials
   - Rotate credentials regularly

## 📊 Monitoring & Alarms (Future)

### CloudWatch Alarms

```typescript
// Lambda error rate alarm
new aws.cloudwatch.MetricAlarm("KefirBatchesErrorAlarm", {
  name: `kefir-app-${$app.stage}-batches-errors`,
  comparisonOperator: "GreaterThanThreshold",
  evaluationPeriods: 2,
  metricName: "Errors",
  namespace: "AWS/Lambda",
  period: 300,
  statistic: "Sum",
  threshold: 10,
  dimensions: {
    FunctionName: handleBatches.name,
  },
  alarmDescription: "Alert when Lambda has too many errors",
  // Add SNS topic for notifications
});
```

## 📝 Documentation Requirements

### Stack Documentation

Each stack file should have:
1. File header comment explaining purpose
2. Interface for dependencies (if any)
3. Inline comments for complex configuration
4. Return type with all outputs

### Example

```typescript
/**
 * Data Stack
 * 
 * Sets up DynamoDB table (single-table design) and S3 bucket for photos.
 * 
 * Resources:
 * - DynamoDB table with GSI1 for alternate access patterns
 * - S3 bucket with encryption, versioning, and lifecycle policies
 */

export default function DataStack() {
  // Implementation...
  
  // Return outputs for dependent stacks
  return {
    tableName: table.name,
    tableArn: table.arn,
    bucketName: bucket.bucket,
    bucketArn: bucket.arn,
    table,    // Full resource for advanced usage
    bucket,
  };
}
```

---

**Remember:** Infrastructure is code. Apply the same quality standards as application code: readability, maintainability, and security.

