# Getting Started with Kefir App Backend

This guide will help you set up and deploy the Kefir app backend for the first time.

## Prerequisites Check

Before you begin, ensure you have:

- ✅ **Node.js 18+** installed
- ✅ **AWS Account** with admin access
- ✅ **AWS CLI** configured with credentials
- ✅ **Docker Desktop** (for local development)
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

### 2. Initialize Backend Project

```bash
cd backend
./scripts/init.sh
```

This script will:
- Check prerequisites
- Install npm dependencies
- Create `.env.local` file
- Validate AWS credentials

### 3. Review Configuration

Open `serverless.yml` and review the settings. The defaults should work for most cases:
- **Region**: us-east-1
- **Stages**: local, dev, prod
- **Runtime**: Node.js 18.x

### 4. Deploy to Dev Environment

```bash
npm run deploy:dev
```

First deployment takes ~5-10 minutes. You'll see:
- ✅ CloudFormation stacks being created
- ✅ Resources being provisioned
- ✅ Output values (API URL, Cognito IDs)

**Save the output values!** You'll need them for the frontend.

### 5. Test the API

Get your API URL from the deployment output:
```bash
export API_URL="https://xxxxx.execute-api.us-east-1.amazonaws.com"

# Test public endpoint (no auth needed)
curl $API_URL/public/b/test-batch-id
```

### 6. (Optional) Seed Test Data

```bash
# Make sure you have tsx installed globally
npm install -g tsx

# Set environment variables from deployment output
export TABLE_NAME="kefir-table-dev"
export USER_POOL_ID="us-east-1_xxxxx"
export CLIENT_ID="xxxxxxxxxxxxxxxxxxxxx"

# Run the seed script
tsx scripts/seed-dev.ts
```

This creates:
- Test user (test@example.com)
- 2 sample batches
- Sample events and reminders

### 7. Configure Frontend

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

### 8. Set Up Local Development (Optional)

For faster iteration with local testing:

```bash
# Start Docker services
npm run local:docker

# Setup local DynamoDB
npm run local:setup

# Seed local data
npm run local:seed

# Start serverless offline
npm run dev
```

Now your API is running at `http://localhost:3000` with hot reload!

### 9. Monitor Deployment

Check CloudWatch logs:
```bash
# View Lambda logs (requires AWS CLI)
aws logs tail /aws/lambda/kefir-backend-dev-batch --follow
```

### 10. Deploy to Production (Later)

When ready for production:

```bash
# Deploy to prod
npm run deploy:prod

# This will:
# - Create prod-specific resources
# - Enable deletion protection
# - Enable point-in-time recovery
# - Set up longer log retention
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
nvm install 18
nvm use 18

# Verify
node -v  # Should show v18.x.x or higher
```

### Issue: "Stack failed to deploy"

**Solution**: Check CloudFormation console
```bash
# View detailed error
aws cloudformation describe-stack-events \
  --stack-name kefir-backend-dev \
  --region us-east-1
```

Common causes:
- IAM permissions insufficient
- Resource limits exceeded
- Name conflicts with existing resources

### Issue: "Serverless command not found"

**Solution**: Install dependencies
```bash
cd backend
npm install
```

### Issue: "Port 3000 already in use"

**Solution**: Kill existing process or use different port
```bash
# Kill existing process
lsof -ti:3000 | xargs kill -9

# Or use a different port
npm run dev -- --httpPort 3001
```

## Development Workflow

### Local Development Mode

```bash
# Start serverless offline (hot reload enabled)
npm run dev

# This enables:
# - Local Lambda execution
# - API Gateway emulation
# - Hot reload on code changes
# - DynamoDB Local (if running)
```

### Making Code Changes

1. Edit Lambda functions in `src/functions/`
2. Save the file
3. Serverless Offline automatically reloads
4. Test immediately

### Viewing Logs

```bash
# Local development logs
# Just watch the serverless offline console

# AWS CloudWatch logs
aws logs tail /aws/lambda/kefir-backend-dev-batch --follow
```

### Updating Dependencies

```bash
# Update packages
npm update

# Check for outdated packages
npm outdated
```

## Next Steps

Now that your backend is deployed:

1. ✅ **Configure Frontend**: Update environment variables
2. ✅ **Test Authentication**: Try Cognito OTP flow
3. ✅ **Test API**: Make requests to your endpoints
4. ✅ **Deploy Frontend**: Deploy to hosting platform
5. ✅ **Set Up CI/CD**: Configure GitHub Actions
6. ✅ **Monitor**: Set up CloudWatch alarms
7. ✅ **Domain**: Configure custom domain (prod)

## Resources

- [Serverless Framework Documentation](https://www.serverless.com/framework/docs)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [API.md](../API.md) - Detailed API documentation
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DATABASE_DESIGN.md](./DATABASE_DESIGN.md) - DynamoDB schema
- [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) - Local dev guide

## Support

If you encounter issues:

1. Check the documentation files
2. Review CloudWatch logs
3. Search Serverless Framework issues on GitHub
4. Open a project issue with details

## Clean Up

To remove dev environment (be careful!):

```bash
# Remove dev stack
npm run remove

# This will DELETE all resources:
# - Lambda functions
# - DynamoDB data
# - S3 files
# - CloudWatch logs
```

**Production cleanup requires manual confirmation** to prevent accidental deletion.

