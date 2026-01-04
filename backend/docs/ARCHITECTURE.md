# Kefir App Architecture

## Overview

The Kefir app uses a serverless architecture on AWS with managed infrastructure via Serverless Framework.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
│                                                                 │
│  ┌──────────────┐           ┌──────────────┐                  │
│  │  iOS App     │           │   Web App    │                  │
│  │  (Expo)      │           │   (Vercel)   │                  │
│  └──────┬───────┘           └──────┬───────┘                  │
│         │                          │                           │
│         └──────────┬───────────────┘                          │
└────────────────────┼────────────────────────────────────────────┘
                     │
                     │ HTTPS
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Authentication                             │
│                                                                 │
│                  ┌───────────────────┐                         │
│                  │  Cognito User Pool │                         │
│                  │  (Email OTP)      │                         │
│                  └───────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
                     │
                     │ JWT Token
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Layer                               │
│                                                                 │
│                  ┌───────────────────┐                         │
│                  │  API Gateway      │                         │
│                  │  (HTTP API)       │                         │
│                  └─────────┬─────────┘                         │
│                            │                                    │
│         ┌──────────────────┼──────────────────┐               │
│         │                  │                  │               │
│         ▼                  ▼                  ▼               │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐           │
│  │ Lambda   │      │ Lambda   │      │ Lambda   │           │
│  │ Batches  │      │ Events   │      │ Reminders│  ...      │
│  └────┬─────┘      └────┬─────┘      └────┬─────┘           │
└───────┼─────────────────┼─────────────────┼──────────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Data Layer                               │
│                                                                 │
│  ┌─────────────────────┐            ┌──────────────────┐      │
│  │   DynamoDB Table    │            │   S3 Bucket      │      │
│  │ (Single-table       │            │   (Photos)       │      │
│  │  design)            │            │                  │      │
│  └─────────────────────┘            └──────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
                          │
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Scheduling Layer                             │
│                                                                 │
│              ┌──────────────────────┐                          │
│              │ EventBridge Scheduler │                          │
│              └──────────┬───────────┘                          │
│                         │                                       │
│                         ▼                                       │
│              ┌──────────────────────┐                          │
│              │  Lambda (Reminders)  │                          │
│              │  ↓                   │                          │
│              │  Expo Push API       │                          │
│              └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Monitoring Layer                              │
│                                                                 │
│              ┌──────────────────────┐                          │
│              │   CloudWatch Logs    │                          │
│              │   CloudWatch Alarms  │                          │
│              └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Authentication
1. User enters email in app
2. Frontend calls Cognito to send OTP
3. User enters OTP
4. Cognito verifies and returns JWT tokens
5. Frontend stores tokens and includes in API requests

### 2. Create Batch
1. User fills batch form in app
2. Frontend sends POST request to `/batches` with JWT
3. API Gateway validates JWT with Cognito
4. Lambda function processes request
5. Lambda writes to DynamoDB with single-table design
6. Lambda returns batch ID and reminder suggestions
7. Frontend displays batch details

### 3. Upload Photo
1. User selects photo in app
2. Frontend requests presigned URL from API
3. Lambda generates presigned S3 URL (5 min expiry)
4. Frontend uploads photo directly to S3
5. Frontend notifies API of successful upload
6. Lambda stores photo metadata in DynamoDB

### 4. Schedule Reminder
1. User confirms suggested reminder
2. Frontend sends POST to `/batches/:id/reminders/confirm`
3. Lambda creates EventBridge Scheduler rule
4. EventBridge triggers Lambda at scheduled time
5. Lambda checks batch status
6. Lambda sends push notification via Expo Push API
7. User receives notification on device

### 5. QR Code Scan
1. User scans QR code
2. App navigates to `bubblebatch.com/b/:batchId`
3. If app installed: deep link opens batch in app
4. If app not installed: web page shows public batch view
5. Public endpoint (no auth) returns batch summary

### 6. CSV Export
1. User requests export from settings
2. Frontend calls `/export.csv`
3. Lambda queries all user data from DynamoDB
4. Lambda formats as CSV with recordType column
5. Lambda returns CSV file
6. Frontend downloads or shares file

## Security

### Authentication
- Cognito JWT tokens (access + refresh)
- API Gateway JWT authorizer
- Public endpoints bypass auth

### Authorization
- User ID extracted from JWT claims
- Queries scoped to authenticated user
- Batch ownership verified before modifications

### S3 Security
- Presigned URLs expire after 5 minutes
- Upload restricted to image/* MIME types
- Max file size: 10MB
- Bucket has public access blocked

### API Security
- CORS configured for app domains only
- Throttling: 1000 requests/sec per user
- Request validation enabled

## Scaling & Performance

### Automatic Scaling
- **Lambda**: Scales automatically with concurrent executions
- **DynamoDB**: On-demand billing, auto-scales
- **S3**: Unlimited storage and requests
- **API Gateway**: Handles high throughput

### Performance Optimizations
- DynamoDB single-table design reduces latency
- GSI for efficient queries
- S3 direct uploads (no Lambda bottleneck)

## Monitoring & Observability

### Metrics
- API Gateway request count, latency, errors
- Lambda invocation count, duration, errors
- DynamoDB consumed capacity, throttles
- S3 request count, errors

### Logging
- All Lambda invocations logged to CloudWatch
- Structured JSON logs with correlation IDs
- Log retention: 14 days (dev), 30 days (prod)

