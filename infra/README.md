# Kefir App Infrastructure

This folder contains the Infrastructure as Code (IaC) for deploying the Kefir app backend to AWS.

## Technology Stack

- **IaC Framework**: SST (Serverless Stack) v3
- **Language**: TypeScript
- **Cloud Provider**: AWS
- **Environments**: dev, prod

## AWS Resources

| Resource | Purpose |
|----------|---------|
| Cognito User Pool | Passwordless email OTP authentication |
| API Gateway (HTTP API) | REST API endpoints |
| Lambda Functions | Backend logic (Node.js) |
| DynamoDB | Single-table data storage |
| S3 Bucket | Photo storage with presigned URLs |
| EventBridge Scheduler | Reminder notifications |
| CloudWatch Logs | Logging and monitoring |

## Project Structure

```
infra/
├── README.md           # This file
├── PLAN.md            # Detailed implementation plan
├── sst.config.ts      # SST configuration
├── package.json       # Dependencies
├── stacks/            # CDK stack definitions
│   ├── AuthStack.ts   # Cognito resources
│   ├── ApiStack.ts    # API Gateway + Lambda
│   ├── DataStack.ts   # DynamoDB + S3
│   └── MonitoringStack.ts # CloudWatch alarms
└── scripts/           # Helper scripts
    └── seed-dev.ts    # Seed dev data
```

## Prerequisites

1. **Node.js**: v18 or later
2. **AWS CLI**: Configured with credentials
3. **AWS Account**: With appropriate permissions
4. **Domain** (optional): kefirproducer.com for production

## Quick Start

### 1. Install Dependencies

```bash
cd infra
npm install
```

### 2. Deploy to Dev

```bash
npm run deploy:dev
```

### 3. Deploy to Production

```bash
npm run deploy:prod
```

## Environment Variables

SST will automatically create a `.env.local` file with deployed resource URLs.

For the frontend, you'll need:
- `VITE_API_URL`: API Gateway endpoint
- `VITE_COGNITO_USER_POOL_ID`: Cognito User Pool ID
- `VITE_COGNITO_CLIENT_ID`: Cognito App Client ID
- `VITE_AWS_REGION`: AWS region

## Development Workflow

### Local Development

```bash
npm run dev
```

This starts SST in dev mode with:
- Live Lambda development
- Local DynamoDB (optional)
- Hot reload

### Viewing Resources

```bash
npm run console
```

Opens SST Console to view deployed resources, logs, and metrics.

### Remove Stack

```bash
npm run remove:dev  # Remove dev environment
npm run remove:prod # Remove prod environment
```

## CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`) will:
1. Deploy backend on push to `main`
2. Run tests before deployment
3. Update frontend environment variables

## Security Considerations

- ✅ IAM roles follow least privilege principle
- ✅ API Gateway has throttling enabled
- ✅ S3 presigned URLs expire after 5 minutes
- ✅ Cognito enforces email OTP authentication
- ✅ CloudWatch logs retained for 14 days

## Cost Estimates

### Dev Environment
- ~$5-10/month (low usage)

### Prod Environment
- ~$20-50/month (moderate usage)
- Scales automatically with Lambda/DynamoDB

## Troubleshooting

### Deploy Fails
```bash
# Check AWS credentials
aws sts get-caller-identity

# Check SST version
npx sst version

# Clear SST cache
rm -rf .sst
```

### Lambda Logs
```bash
# View logs in real-time
npm run logs -- ApiStack/handleBatches
```

## Next Steps

1. Review `PLAN.md` for implementation roadmap
2. Set up AWS credentials
3. Deploy dev environment
4. Test API endpoints
5. Configure frontend with environment variables
6. Deploy production environment

