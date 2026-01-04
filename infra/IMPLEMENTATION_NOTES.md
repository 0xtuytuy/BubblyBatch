# Infrastructure Implementation Notes

## Overview

This document provides implementation details and notes for the Kefir App infrastructure built with SST v3 and Pulumi.

## Implementation Status

All infrastructure stacks have been implemented:

- ✅ **AuthStack**: Cognito User Pool with email OTP authentication
- ✅ **DataStack**: DynamoDB (single-table design) + S3 bucket
- ✅ **ApiStack**: API Gateway HTTP API + Lambda functions
- ✅ **SchedulerStack**: EventBridge Scheduler for reminders
- ✅ **MonitoringStack**: CloudWatch logs and alarms (prod only)
- ✅ **CI/CD Workflows**: GitHub Actions for deployment
- ✅ **Seed Script**: Development data seeding

## Technology Stack

### Infrastructure as Code
- **SST v3**: Serverless Stack framework
- **Pulumi AWS SDK**: Used for AWS resource definitions
- **TypeScript**: Type-safe infrastructure code

### AWS Services
- **Cognito**: User authentication with email OTP
- **API Gateway**: HTTP API for REST endpoints
- **Lambda**: Node.js 20.x on ARM64 architecture
- **DynamoDB**: Single-table design with GSI
- **S3**: Photo storage with lifecycle policies
- **EventBridge**: Scheduled reminder processing
- **CloudWatch**: Logging and monitoring

## Key Implementation Details

### 1. Authentication (AuthStack)

**Features**:
- Email as username
- Email verification required
- OTP authentication flow
- Token validity: 60 min access, 30 days refresh
- Advanced security mode enabled in production

**Configuration**:
- User pool deletion protection in prod
- Self sign-up enabled
- Account recovery via email
- Prevent user existence errors enabled

### 2. Data Storage (DataStack)

**DynamoDB Table**:
- Single-table design pattern
- Partition key: `PK`, Sort key: `SK`
- GSI1: `GSI1PK` / `GSI1SK` for alternate access patterns
- On-demand billing mode
- Point-in-time recovery in prod
- TTL enabled on `TTL` attribute
- Server-side encryption enabled

**S3 Bucket**:
- Versioning enabled in prod
- Public access blocked
- AES256 encryption
- CORS configured for app domains
- Lifecycle policies:
  - Delete objects after 365 days
  - Abort incomplete uploads after 7 days

### 3. API Layer (ApiStack)

**API Gateway**:
- HTTP API (not REST API)
- JWT authorizer using Cognito
- CORS configured for app domains
- Throttling: 1000 req/sec burst, 2000 rate limit

**Lambda Functions**:
- Runtime: Node.js 20.x
- Architecture: ARM64 (Graviton2)
- Memory: 512 MB
- Timeout: 30 seconds
- Environment variables auto-injected via Pulumi

**Endpoints**:
- Authentication: `/auth/login`, `/auth/verify` (no auth)
- Batches: CRUD operations (with auth)
- Events: Timeline management (with auth)
- Reminders: Suggestions and scheduling (with auth)
- Devices: Push notification registration (with auth)
- Export: CSV data export (with auth)
- Public: Batch view (no auth)

**IAM Permissions**:
- DynamoDB: Full access to table and indexes
- S3: Read/write to bucket
- Cognito: Admin user operations

### 4. Scheduler (SchedulerStack)

**EventBridge Rule**:
- Trigger: Every 5 minutes
- Target: Reminder processor Lambda
- Input: JSON with source metadata

**Reminder Processor**:
- Queries DynamoDB for due reminders
- Uses GSI1 for efficient lookups
- Sends notifications via Expo Push API
- Updates reminder status after delivery
- Handles errors gracefully

### 5. Monitoring (MonitoringStack)

**CloudWatch Alarms** (prod only):
- Lambda errors > 10/min
- Lambda throttles > 5/min
- Lambda duration > 10 seconds
- API Gateway 5xx > 10/min
- API Gateway 4xx > 100/5min
- DynamoDB read/write throttles > 5/min

**CloudWatch Dashboard**:
- API Gateway metrics
- Lambda invocations and errors
- DynamoDB operations and latency
- Custom time range selection

**SNS Topic**:
- Central alert topic for all alarms
- Can be subscribed to email/SMS

## CI/CD Pipeline

### Deployment Workflow (`.github/workflows/deploy.yml`)

**Triggers**:
- Push to `main` branch → auto-deploy to dev
- Manual workflow dispatch → deploy to dev or prod

**Steps**:
1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Type check and lint
5. Configure AWS credentials
6. Deploy with SST
7. Comment on commit with status

**Secrets Required**:
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (dev)
- `AWS_ACCESS_KEY_ID_PROD` / `AWS_SECRET_ACCESS_KEY_PROD` (prod)
- `PULUMI_ACCESS_TOKEN` (if using Pulumi Cloud)
- `AWS_REGION` (optional, defaults to us-east-1)

### PR Checks Workflow (`.github/workflows/pr-check.yml`)

**Triggers**:
- Pull requests to `main`

**Checks**:
1. Type check (TypeScript)
2. Lint (ESLint)
3. Format check (Prettier)
4. SST config validation

## Development Seed Script

**Location**: `scripts/seed-dev.ts`

**What it seeds**:
- Test user: `test@example.com` (user ID: test123)
- 2 sample batches (active and in_fridge)
- Events for each batch
- Sample reminders

**Usage**:
```bash
export TABLE_NAME="your-table-name"
export USER_POOL_ID="your-user-pool-id"
export AWS_REGION="us-east-1"
tsx scripts/seed-dev.ts
```

## Important Notes

### SST v3 with Pulumi

The implementation uses Pulumi AWS SDK (`@pulumi/aws`) for defining infrastructure resources. This is compatible with SST v3, which uses Pulumi as its underlying engine.

**Key differences from SST v2**:
- No CDK constructs (no `new sst.Table()`)
- Uses Pulumi resources directly
- Async stack functions with dynamic imports
- Global `$app` and `$config` variables

### Lambda Handler Placeholders

The Lambda functions currently have placeholder handlers that return simple JSON responses. These need to be replaced with actual implementation:

**Next steps**:
1. Create a `backend` package with Lambda handlers
2. Build handlers into deployment packages
3. Update Lambda `code` property to use built packages
4. Configure proper error handling and logging

### Environment Variables

Lambda functions automatically receive these environment variables:
- `TABLE_NAME`: DynamoDB table name
- `BUCKET_NAME`: S3 bucket name
- `USER_POOL_ID`: Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Cognito App Client ID
- `STAGE`: Current deployment stage (dev/prod)
- `AWS_REGION`: AWS region

### Resource Naming Convention

All resources follow this pattern:
- Development: `kefir-app-dev-{resource}`
- Production: `kefir-app-prod-{resource}`

This prevents naming conflicts between environments.

### Cost Optimization

**Development**:
- All resources have "remove" policy
- Minimal retention periods
- No deletion protection

**Production**:
- Critical resources have "retain" policy
- Longer retention periods (30 days)
- Deletion protection enabled
- Point-in-time recovery for DynamoDB
- S3 versioning enabled

## Testing the Deployment

### 1. Verify AWS Resources

```bash
# Check if resources were created
aws cloudformation list-stacks --region us-east-1 | grep kefir-app

# View stack outputs
aws cloudformation describe-stacks \
  --stack-name kefir-app-dev \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

### 2. Test Public Endpoint

```bash
export API_URL="https://xxxxx.execute-api.us-east-1.amazonaws.com"
curl $API_URL/public/b/test-batch-id
```

### 3. Test Authentication Flow

Use a tool like Postman or curl to:
1. Call `/auth/login` with email
2. Get OTP from Cognito (check CloudWatch logs)
3. Call `/auth/verify` with OTP
4. Receive JWT tokens

### 4. Monitor Logs

```bash
# View Lambda logs
npm run logs -- ApiStack/handleAuth

# Or use SST Console
npm run console
```

## Security Considerations

### IAM Least Privilege

Each Lambda function has its own IAM role with minimal permissions:
- DynamoDB: Only table access (no global tables)
- S3: Only specific bucket access
- Cognito: Only required admin operations

### Network Security

- S3 bucket blocks all public access
- API Gateway uses HTTPS only
- CORS restricted to app domains in prod
- Presigned URLs expire in 5 minutes

### Data Protection

- DynamoDB encryption at rest (AWS managed)
- S3 encryption at rest (AES256)
- CloudWatch logs encrypted
- No sensitive data in Lambda logs

## Troubleshooting

### Common Issues

**1. Pulumi dependency not found**
```bash
cd infra
npm install @pulumi/aws @pulumi/pulumi
```

**2. Type errors in stack files**
```bash
# Regenerate SST types
npm run types
```

**3. Deployment fails with permissions error**
- Verify AWS credentials have admin access
- Check CloudFormation service limits
- Review IAM policies

**4. Lambda function returns 500 error**
- Check CloudWatch logs for the function
- Verify environment variables are set
- Check IAM role has required permissions

### Getting Help

1. Review stack-specific logs in CloudWatch
2. Use SST Console for interactive debugging
3. Check AWS CloudFormation events for detailed errors
4. Review this file and other documentation

## Next Steps

### Backend Implementation

1. Create `backend` package structure
2. Implement Lambda handlers for each function
3. Add business logic and data access layer
4. Write unit tests for handlers
5. Update Lambda functions to use built code

### Frontend Integration

1. Get API URL and Cognito IDs from deployment output
2. Configure frontend environment variables
3. Implement authentication flow
4. Connect to API endpoints
5. Test end-to-end flows

### Production Deployment

1. Review security settings
2. Configure custom domain
3. Set up DNS records
4. Deploy to prod stage
5. Configure monitoring alerts
6. Set up backup procedures

## Resources

- [SST v3 Documentation](https://sst.dev)
- [Pulumi AWS Documentation](https://www.pulumi.com/docs/reference/pkg/aws/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Single-Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)

## Changelog

### 2025-01-04
- ✅ Initial infrastructure implementation
- ✅ All 5 stacks implemented (Auth, Data, API, Scheduler, Monitoring)
- ✅ GitHub Actions CI/CD workflows created
- ✅ Development seed script implemented
- ✅ Documentation updated

---

**Last Updated**: January 4, 2025  
**Status**: Ready for backend handler implementation

