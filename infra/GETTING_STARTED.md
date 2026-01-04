# Getting Started with Kefir App Infrastructure

This guide will help you set up and deploy the Kefir app infrastructure for the first time.

## Prerequisites Check

Before you begin, ensure you have:

- ✅ **Node.js 18+** installed
- ✅ **AWS Account** with admin access
- ✅ **AWS CLI** configured with credentials
- ✅ **Git** for version control

## Step-by-Step Setup

### 1. Verify AWS Credentials

```bash
# Check if AWS CLI is configured
aws sts get-caller-identity

# Expected output should show your AWS account details
# {
#   "UserId": "...",
#   "Account": "123456789012",
#   "Arn": "arn:aws:iam::123456789012:user/yourname"
# }
```

If not configured:
```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Default region: us-east-1
# Default output format: json
```

### 2. Initialize Infrastructure Project

```bash
cd infra
./scripts/init.sh
```

This script will:
- Check prerequisites
- Install npm dependencies
- Create `.env.local` file
- Validate AWS credentials

### 3. Review Configuration

Open `sst.config.ts` and review the settings. The defaults should work for most cases:
- **Region**: us-east-1
- **Stages**: dev, prod
- **Removal policy**: dev=remove, prod=retain

### 4. Deploy to Dev Environment

```bash
npm run deploy:dev
```

First deployment takes ~5-10 minutes. You'll see:
- ✅ CloudFormation stacks being created
- ✅ Resources being provisioned
- ✅ Output values (API URL, Cognito IDs)

**Save the output values!** You'll need them for the frontend.

### 5. Open SST Console

```bash
npm run console
```

This opens a web dashboard where you can:
- View real-time logs
- Monitor Lambda functions
- Inspect DynamoDB data
- Test API endpoints
- See deployed resources

### 6. (Optional) Seed Test Data

```bash
# Make sure you have tsx installed globally or use npx
npm install -g tsx

# Run the seed script
tsx scripts/seed-dev.ts
```

This creates:
- Test user (test@example.com)
- 2 sample batches
- Sample events and reminders

### 7. Test API Endpoints

Get your API URL from the deployment output:
```bash
export API_URL="https://xxxxx.execute-api.us-east-1.amazonaws.com"

# Test public endpoint (no auth needed)
curl $API_URL/health

# Test authenticated endpoint
# (You'll need a valid JWT token from Cognito)
```

### 8. Configure Frontend

Update your frontend `.env` file with the deployed values:

```bash
# In your frontend project
cat > .env.local << EOF
VITE_API_URL=https://xxxxx.execute-api.us-east-1.amazonaws.com
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
VITE_AWS_REGION=us-east-1
EOF
```

### 9. Monitor Deployment

Check CloudWatch logs:
```bash
# View Lambda logs
npm run logs -- ApiStack/handleBatches

# Or use SST Console for better UX
npm run console
```

### 10. Deploy to Production (Later)

When ready for production:

```bash
# Deploy to prod
npm run deploy:prod

# This will:
# - Create prod-specific resources
# - Enable retention policies
# - Set up monitoring alarms
# - Use more conservative settings
```

## Common Issues & Solutions

### Issue: "Unable to locate credentials"

**Solution**: Configure AWS CLI
```bash
aws configure
```

### Issue: "Node version too old"

**Solution**: Update Node.js
```bash
# Using nvm
nvm install 20
nvm use 20

# Verify
node -v  # Should show v20.x.x
```

### Issue: "Stack failed to deploy"

**Solution**: Check CloudFormation console
```bash
# View detailed error
aws cloudformation describe-stack-events \
  --stack-name kefir-app-dev \
  --region us-east-1
```

Common causes:
- IAM permissions insufficient
- Resource limits exceeded
- Name conflicts with existing resources

### Issue: "SST command not found"

**Solution**: Install dependencies
```bash
cd infra
npm install
```

### Issue: "Port 13557 already in use"

**Solution**: SST dev mode is already running
```bash
# Kill existing SST process
pkill -f "sst dev"

# Or use a different console port
npm run dev -- --console-port 13558
```

## Development Workflow

### Local Development Mode

```bash
# Start SST in dev mode
npm run dev

# This enables:
# - Live Lambda development (hot reload)
# - Local debugging
# - Faster iteration
```

### Making Infrastructure Changes

1. Edit stack files in `stacks/`
2. SST will automatically detect changes
3. Test in dev environment first
4. Deploy to prod after validation

### Viewing Logs

```bash
# Real-time logs for a specific function
npm run logs -- ApiStack/handleBatches

# Or use SST Console (recommended)
npm run console
```

### Updating Dependencies

```bash
# Update SST and AWS CDK
npm update sst aws-cdk-lib

# Check for outdated packages
npm outdated
```

## Next Steps

Now that your infrastructure is deployed:

1. ✅ **Configure Frontend**: Update environment variables
2. ✅ **Test Authentication**: Try Cognito OTP flow
3. ✅ **Test API**: Make requests to your endpoints
4. ✅ **Deploy Frontend**: Deploy to Vercel/Netlify
5. ✅ **Set Up CI/CD**: Configure GitHub Actions
6. ✅ **Monitor**: Set up CloudWatch alarms
7. ✅ **Domain**: Configure custom domain (prod)

## Resources

- [SST Documentation](https://docs.sst.dev)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Project PLAN.md](./PLAN.md) - Detailed implementation roadmap
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - DynamoDB schema

## Support

If you encounter issues:

1. Check the [PLAN.md](./PLAN.md) troubleshooting section
2. Review CloudWatch logs in SST Console
3. Search SST Discord for similar issues
4. Open a GitHub issue with details

## Clean Up

To remove dev environment (be careful!):

```bash
# Remove dev stack
npm run remove:dev

# This will DELETE all resources in dev
# - Lambda functions
# - DynamoDB data
# - S3 files
# - CloudWatch logs
```

**Production cleanup requires manual confirmation** to prevent accidental deletion.

