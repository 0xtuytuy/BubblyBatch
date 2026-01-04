# Infrastructure Implementation Plan

This document outlines the step-by-step plan for implementing the Kefir app infrastructure.

## Phase 1: Project Setup ✓

- [x] Create infra folder structure
- [ ] Initialize SST project
- [ ] Configure package.json with scripts
- [ ] Set up TypeScript configuration
- [ ] Add .gitignore for infra artifacts

## Phase 2: Core Infrastructure

### 2.1 Authentication Stack
- [ ] Create AuthStack.ts
- [ ] Configure Cognito User Pool
  - [ ] Email as username
  - [ ] OTP authentication (no passwords)
  - [ ] Custom email templates
  - [ ] MFA disabled
- [ ] Create Cognito App Client
  - [ ] Enable email OTP flow
  - [ ] Configure token expiration
- [ ] Export User Pool ID and Client ID for frontend

### 2.2 Data Stack
- [ ] Create DataStack.ts
- [ ] Set up DynamoDB table (single-table design)
  - [ ] Primary Key: PK (partition key)
  - [ ] Sort Key: SK (sort key)
  - [ ] GSI1: GSI1PK, GSI1SK (for queries)
  - [ ] Enable point-in-time recovery (prod)
  - [ ] On-demand billing mode
- [ ] Create S3 bucket for photos
  - [ ] Enable versioning (prod)
  - [ ] Configure CORS for presigned URLs
  - [ ] Lifecycle policy (delete after 1 year)
  - [ ] Block public access
- [ ] Create IAM role for Lambda S3 access

### 2.3 API Stack
- [ ] Create ApiStack.ts
- [ ] Set up API Gateway HTTP API
  - [ ] Configure CORS
  - [ ] Add JWT authorizer (Cognito)
  - [ ] Enable throttling (1000 req/sec)
  - [ ] Custom domain (prod only)
- [ ] Create Lambda functions:
  - [ ] `handleAuth`: Auth-related endpoints
  - [ ] `handleBatches`: Batch CRUD operations
  - [ ] `handleEvents`: Batch events
  - [ ] `handleReminders`: Reminder management
  - [ ] `handleDevices`: Device registration
  - [ ] `handleExport`: CSV export
  - [ ] `handlePublic`: Public batch view
- [ ] Configure Lambda environment variables
  - [ ] TABLE_NAME
  - [ ] BUCKET_NAME
  - [ ] USER_POOL_ID
- [ ] Set up API routes
  - [ ] POST /auth/login
  - [ ] POST /auth/verify
  - [ ] POST /batches
  - [ ] GET /batches
  - [ ] GET /batches/:id
  - [ ] POST /batches/:id/events
  - [ ] GET /batches/:id/events
  - [ ] GET /batches/:id/reminders/suggestions
  - [ ] POST /batches/:id/reminders/confirm
  - [ ] GET /me/reminders
  - [ ] POST /me/devices
  - [ ] GET /export.csv
  - [ ] GET /public/b/:batchId

### 2.4 Scheduler Stack
- [ ] Create SchedulerStack.ts
- [ ] Set up EventBridge Scheduler
  - [ ] Create scheduler role
  - [ ] Configure reminder Lambda trigger
  - [ ] Enable scheduler logs
- [ ] Create reminder processor Lambda
  - [ ] Check for due reminders
  - [ ] Send push notifications via Expo
  - [ ] Update reminder status in DynamoDB

### 2.5 Monitoring Stack
- [ ] Create MonitoringStack.ts
- [ ] Configure CloudWatch Log Groups
  - [ ] Retention: 14 days (dev), 30 days (prod)
- [ ] Set up CloudWatch Alarms (prod only)
  - [ ] Lambda errors > 10/min
  - [ ] API Gateway 5xx errors
  - [ ] DynamoDB throttling
- [ ] SNS topic for alerts (optional)

## Phase 3: Configuration & Scripts

### 3.1 Environment Configuration
- [ ] Create sst.config.ts
  - [ ] Define dev stage
  - [ ] Define prod stage
  - [ ] Configure region (us-east-1)
  - [ ] Set up stage-specific parameters
- [ ] Create .env.example
- [ ] Document required environment variables

### 3.2 Helper Scripts
- [ ] Create seed-dev.ts
  - [ ] Seed test users
  - [ ] Create sample batches
  - [ ] Add test events
- [ ] Create cleanup script
  - [ ] Remove old S3 objects
  - [ ] Archive old batches
- [ ] Create migration scripts (future)

## Phase 4: CI/CD

### 4.1 GitHub Actions
- [ ] Create .github/workflows/deploy.yml
  - [ ] Trigger on push to main
  - [ ] Run tests
  - [ ] Deploy to dev
  - [ ] Deploy to prod (manual approval)
- [ ] Create .github/workflows/test.yml
  - [ ] Run on PRs
  - [ ] Lint TypeScript
  - [ ] Run unit tests
- [ ] Store AWS credentials in GitHub Secrets
  - [ ] AWS_ACCESS_KEY_ID
  - [ ] AWS_SECRET_ACCESS_KEY
  - [ ] AWS_REGION

### 4.2 Frontend Integration
- [ ] Export API URL to environment
- [ ] Export Cognito config to environment
- [ ] Configure Vercel/Netlify with env vars
- [ ] Set up Vercel GitHub integration

## Phase 5: Security Hardening

- [ ] Enable AWS WAF (prod only, optional)
- [ ] Configure API Gateway request validation
- [ ] Set up AWS Secrets Manager for sensitive config
- [ ] Enable CloudTrail for audit logs
- [ ] Review IAM policies for least privilege
- [ ] Enable S3 bucket encryption
- [ ] Configure VPC endpoints (optional, for private Lambda)

## Phase 6: Testing & Validation

### 6.1 Infrastructure Tests
- [ ] Test Cognito OTP flow
- [ ] Validate API Gateway endpoints
- [ ] Check Lambda function permissions
- [ ] Verify DynamoDB access patterns
- [ ] Test S3 presigned URL generation
- [ ] Validate EventBridge scheduler

### 6.2 Integration Tests
- [ ] Test auth flow end-to-end
- [ ] Create and fetch batches
- [ ] Upload photos to S3
- [ ] Trigger reminders
- [ ] Export CSV
- [ ] Access public batch view

### 6.3 Load Testing (optional)
- [ ] Use artillery or k6
- [ ] Test API Gateway limits
- [ ] Validate DynamoDB auto-scaling
- [ ] Check Lambda cold starts

## Phase 7: Documentation

- [ ] Complete README.md
- [ ] Document DynamoDB table design
- [ ] Create API documentation (OpenAPI spec)
- [ ] Write deployment runbook
- [ ] Document disaster recovery process
- [ ] Create architecture diagram

## Phase 8: Production Deployment

- [ ] Register domain (bubblebatch.com)
- [ ] Configure Route 53
- [ ] Set up custom domain for API Gateway
- [ ] Deploy prod environment
- [ ] Configure DNS records
- [ ] Test production deployment
- [ ] Set up monitoring alerts
- [ ] Create backup strategy

## Estimated Timeline

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Setup | 1 hour |
| Phase 2: Core Infrastructure | 8-12 hours |
| Phase 3: Configuration | 2-3 hours |
| Phase 4: CI/CD | 3-4 hours |
| Phase 5: Security | 2-3 hours |
| Phase 6: Testing | 4-6 hours |
| Phase 7: Documentation | 2-3 hours |
| Phase 8: Production | 2-3 hours |
| **Total** | **24-36 hours** |

## Success Criteria

- ✅ Dev environment deploys successfully
- ✅ All API endpoints return expected responses
- ✅ Cognito authentication works
- ✅ Photos upload to S3
- ✅ Reminders are scheduled correctly
- ✅ Frontend can connect to backend
- ✅ CI/CD pipeline runs without errors
- ✅ Production environment is secure and monitored

## Notes

- Use SST Console for debugging during development
- Keep dev and prod environments isolated
- Tag all resources for cost tracking
- Use SST's built-in resource binding for Lambda env vars
- Consider using SST's RDS component for future PostgreSQL migration

