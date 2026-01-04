# Backend Implementation Notes

## Overview

This document provides implementation details and notes for the Kefir App backend built with Serverless Framework.

## Implementation Status

All backend Lambda functions have been implemented:

- ✅ **batch/handler.ts**: Batch CRUD operations, photo management
- ✅ **event/handler.ts**: Batch timeline events
- ✅ **reminder/handler.ts**: Reminder suggestions and scheduling
- ✅ **user/handler.ts**: Device registration for push notifications
- ✅ **export/handler.ts**: CSV data export
- ✅ **public/handler.ts**: Public batch view (no auth)
- ✅ **Local development**: Docker, mocks, seed scripts

## Technology Stack

### Framework & Runtime
- **Serverless Framework v3**: Infrastructure as Code
- **Node.js 18.x**: Lambda runtime
- **TypeScript**: Type-safe code
- **Zod**: Runtime validation

### AWS Services
- **Cognito**: User authentication with email OTP
- **API Gateway**: HTTP API for REST endpoints
- **Lambda**: Serverless compute
- **DynamoDB**: Single-table design with GSI
- **S3**: Photo storage with presigned URLs
- **EventBridge**: Scheduled reminder processing
- **CloudWatch**: Logging and monitoring

## Key Implementation Details

### 1. Authentication

**Features**:
- JWT token validation via API Gateway authorizer
- User ID extracted from JWT claims
- Automatic user creation on first API call
- Public endpoints bypass authentication

**Configuration** (resources/cognito.yml):
- Email as username
- Email verification required
- Custom auth flow for OTP
- Token validity: 1 hour access, 30 days refresh

### 2. Data Storage

**DynamoDB Table** (resources/dynamodb.yml):
- Single-table design pattern
- Partition key: `PK`, Sort key: `SK`
- GSI1: `GSI1PK` / `GSI1SK` for alternate access patterns
- On-demand billing mode
- Point-in-time recovery enabled
- DynamoDB Streams for event processing

**S3 Bucket** (resources/s3.yml):
- Presigned URLs for direct uploads (5 min expiry)
- CORS configured for app domains
- Lifecycle policy: delete after 1 year
- Public access blocked

### 3. API Layer

**API Gateway** (serverless.yml):
- HTTP API (not REST API)
- JWT authorizer using Cognito
- CORS configured
- Throttling: 1000 req/sec
- Serverless Offline for local development

**Lambda Functions**:
- Memory: 256 MB
- Timeout: 30 seconds (60s for export)
- Environment variables auto-injected
- Shared code in lib/ folder

**Endpoints**:
- Batches: POST, GET, PUT, DELETE `/batches`
- Events: POST, GET `/batches/:id/events`
- Reminders: GET, POST `/batches/:id/reminders/*`
- Devices: POST `/me/devices`
- Export: GET `/export.csv`
- Public: GET `/public/b/:batchId` (no auth)

**IAM Permissions** (serverless.yml):
- DynamoDB: Full access to table and indexes
- S3: Read/write to bucket
- EventBridge Scheduler: CRUD schedules

### 4. Photo Upload Flow

1. Client requests presigned URL: `POST /batches/:id/photo/upload-url`
2. Lambda generates S3 presigned PUT URL (5 min expiry)
3. Client uploads directly to S3 using presigned URL
4. Client confirms upload: `POST /batches/:id/photo`
5. Lambda stores photo metadata in DynamoDB
6. Client can get photo URLs: `GET /batches/:id/photos`

### 5. Reminder System

**EventBridge Scheduler** (resources/eventbridge.yml):
- Creates individual schedules for each reminder
- One-time execution at specific time
- Invokes reminder processor Lambda
- Automatically deleted after execution

**Reminder Flow**:
1. User creates batch → suggestions generated
2. User confirms reminder → EventBridge schedule created
3. At scheduled time → Lambda triggered
4. Lambda queries DynamoDB for reminder details
5. Lambda sends push notification via Expo
6. Lambda updates reminder status to "sent"

### 6. Local Development

**Docker Services** (docker-compose.yml):
- **dynamodb-local**: Official AWS DynamoDB Local
- **dynamodb-admin**: Web UI for viewing data

**Mock Services** (local/):
- **mock-services.ts**: In-memory DynamoDB/S3/Scheduler
- **mock-scheduler.ts**: Manual reminder processing
- **mock-push.ts**: Console-logged push notifications

**Scripts** (scripts/):
- **setup-local-dynamo.ts**: Create local tables
- **seed-dev.ts**: Populate test data
- **reset-local-db.ts**: Clear all data
- **generate-test-token.ts**: Generate Cognito JWT
- **quick-test.sh**: One-command local setup

## Code Organization

### Shared Libraries (src/lib/)

**auth.ts**: JWT validation and user context extraction
**db.ts**: DynamoDB client with helper methods
**s3.ts**: S3 client with presigned URL generation
**scheduler.ts**: EventBridge Scheduler client

### Data Models (src/models/)

Each model defines:
- TypeScript interfaces
- Zod validation schemas
- DynamoDB key patterns

**batch.ts**: Batch entity with stage/status
**event.ts**: Timeline events
**reminder.ts**: Scheduled reminders
**device.ts**: Push notification devices
**user.ts**: User profile

### Utilities (src/utils/)

**errors.ts**: Custom error classes and handlers
**response.ts**: HTTP response helpers
**validation.ts**: Request parsing with Zod

## Environment Variables

Lambda functions receive:
- `TABLE_NAME`: DynamoDB table name
- `BUCKET_NAME`: S3 bucket name
- `USER_POOL_ID`: Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Cognito App Client ID
- `SCHEDULER_GROUP_NAME`: EventBridge scheduler group
- `STAGE`: Deployment stage (local/dev/prod)
- `IS_OFFLINE`: "true" when running with serverless-offline
- `AWS_ACCOUNT_ID`: AWS account ID

## Resource Naming Convention

All resources follow this pattern:
- Local: `kefir-{resource}-local`
- Development: `kefir-{resource}-dev`
- Production: `kefir-{resource}-prod`

Examples:
- `kefir-table-dev`
- `kefir-photos-prod`
- `kefir-reminders-local`

## Deployment

### Development

```bash
npm run deploy:dev
```

Creates:
- Cognito User Pool
- DynamoDB table
- S3 bucket
- Lambda functions
- API Gateway
- EventBridge resources
- CloudWatch log groups

### Production

```bash
npm run deploy:prod
```

Enables:
- Point-in-time recovery
- S3 versioning
- Extended log retention
- Deletion protection
- CloudWatch alarms

### Removal

```bash
npm run remove  # Remove from current stage
```

## Testing Strategies

### Unit Tests

Test individual functions without AWS:
```typescript
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const dynamoMock = mockClient(DynamoDBClient);
dynamoMock.on(PutItemCommand).resolves({});

// Your test here
```

### Integration Tests

Test against local DynamoDB:
```bash
# Start local services
npm run local:docker

# Run tests
npm test
```

### Manual API Testing

```bash
# Start local dev
npm run dev

# Test endpoints
http localhost:3000/public/b/batch001
http POST localhost:3000/batches name="Test" waterVolumeMl:=1000
```

## Important Notes

### Serverless Offline

- Runs Lambda functions locally
- Emulates API Gateway
- Hot reload on code changes
- No Cognito auth validation (use noAuth: true)
- Set IS_OFFLINE=true in environment

### DynamoDB Local

- Runs in Docker container
- Compatible with AWS SDK
- Persists data in container
- Accessible at http://localhost:8000
- Admin UI at http://localhost:8001

### Cost Optimization

**Development**:
- Use DynamoDB Local (free)
- Minimal S3 usage
- No EventBridge executions
- Short log retention (14 days)

**Production**:
- On-demand billing
- S3 lifecycle policies
- EventBridge charges per execution
- Extended log retention (30 days)

## Security Considerations

### IAM Least Privilege

Each Lambda has minimal permissions:
- DynamoDB: Only table access
- S3: Only specific bucket
- Scheduler: Only schedule CRUD

### Data Protection

- DynamoDB encryption at rest
- S3 encryption at rest
- CloudWatch logs encrypted
- No sensitive data in logs

### Network Security

- S3 bucket blocks public access
- API Gateway HTTPS only
- CORS restricted to app domains in prod
- Presigned URLs expire quickly

## Troubleshooting

### Common Issues

**1. Function returns 500 error**
- Check CloudWatch logs
- Verify environment variables
- Check IAM permissions

**2. DynamoDB connection fails**
- Verify table exists
- Check table name in env
- Verify IAM permissions

**3. S3 upload fails**
- Check presigned URL expiry
- Verify CORS configuration
- Check file size limits

**4. Serverless Offline not working**
- Restart: Ctrl+C and npm run dev
- Check port 3000 availability
- Verify serverless.yml syntax

## Resources

- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [DynamoDB Single-Table Design](https://www.alexdebrie.com/posts/dynamodb-single-table/)

## Changelog

### 2025-01-04
- ✅ All Lambda handlers implemented
- ✅ Local development setup complete
- ✅ Docker services configured
- ✅ Mock services implemented
- ✅ Seed scripts created
- ✅ Documentation updated

---

**Last Updated**: January 4, 2025  
**Status**: Production ready

