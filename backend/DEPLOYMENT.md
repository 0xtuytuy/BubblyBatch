# Kefir Backend Deployment Guide

This guide walks you through deploying the Kefir backend to AWS.

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **AWS CLI**: Installed and configured with credentials
   ```bash
   aws configure
   ```
3. **Node.js**: Version 18 or higher
4. **npm**: For installing dependencies

## Installation

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Verify your AWS credentials:
   ```bash
   aws sts get-caller-identity
   ```

## Deployment Steps

### 1. Deploy to Development

Deploy all resources to the `dev` stage:

```bash
npm run deploy:dev
```

This will create:
- DynamoDB table: `kefir-table-dev`
- S3 bucket: `kefir-photos-dev-{accountId}`
- Cognito User Pool and Client
- EventBridge Scheduler group
- 6 Lambda functions
- API Gateway HTTP API
- All IAM roles and permissions

The deployment typically takes 3-5 minutes.

### 2. Capture Output Values

After deployment, Serverless will output important values:

```
Stack Outputs:
  ApiUrl: https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
  UserPoolId: us-east-1_XXXXXXXXX
  UserPoolClientId: xxxxxxxxxxxxxxxxxxxxxxxxxx
  TableName: kefir-table-dev
  BucketName: kefir-photos-dev-123456789012
```

**Save these values** - you'll need them for:
- Frontend configuration
- Testing
- Future deployments

### 3. Test the Deployment

Test the public endpoint (no auth required):

```bash
curl https://your-api-url.execute-api.us-east-1.amazonaws.com/public/b/test-batch-id
```

You should receive a response (likely a 404 or 403 since no batches exist yet).

### 4. Set Up Authentication

To test authenticated endpoints, you need to:

1. Create a user in Cognito:
   ```bash
   aws cognito-idp sign-up \
     --client-id YOUR_CLIENT_ID \
     --username user@example.com \
     --password TempPassword123! \
     --user-attributes Name=email,Value=user@example.com
   ```

2. Confirm the user (admin command):
   ```bash
   aws cognito-idp admin-confirm-sign-up \
     --user-pool-id YOUR_USER_POOL_ID \
     --username user@example.com
   ```

3. Get an authentication token:
   ```bash
   aws cognito-idp initiate-auth \
     --auth-flow USER_PASSWORD_AUTH \
     --client-id YOUR_CLIENT_ID \
     --auth-parameters USERNAME=user@example.com,PASSWORD=TempPassword123!
   ```

4. Use the `IdToken` from the response in your API requests:
   ```bash
   curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
     https://your-api-url.execute-api.us-east-1.amazonaws.com/batches
   ```

## Deploy to Production

When ready for production:

```bash
npm run deploy:prod
```

This creates a separate production stack with the `prod` stage.

## Environment Variables

Key environment variables (automatically set by Serverless):

- `TABLE_NAME`: DynamoDB table name
- `BUCKET_NAME`: S3 bucket name
- `USER_POOL_ID`: Cognito User Pool ID
- `USER_POOL_CLIENT_ID`: Cognito User Pool Client ID
- `SCHEDULER_GROUP_NAME`: EventBridge Scheduler group name
- `STAGE`: Current deployment stage

## Monitoring

### CloudWatch Logs

View logs for a specific function:

```bash
npm run logs -- -f batch
```

Or use the AWS Console:
1. Go to CloudWatch → Log Groups
2. Find `/aws/lambda/kefir-backend-dev-batch`

### Metrics

Monitor in CloudWatch:
- Lambda invocations
- Lambda errors
- API Gateway requests
- DynamoDB read/write capacity

## Updating the Stack

To deploy changes:

```bash
npm run deploy:dev
```

Serverless will:
- Update only changed resources
- Preserve existing data in DynamoDB and S3
- Handle Lambda function updates with zero downtime

## Removing the Stack

**Warning**: This will delete all resources and data!

```bash
serverless remove --stage dev
```

To keep data, manually backup:
- DynamoDB table (use AWS Backup or exports)
- S3 bucket contents

## Troubleshooting

### Deployment Fails

1. **IAM Permissions**: Ensure your AWS user has permissions for:
   - CloudFormation
   - Lambda
   - DynamoDB
   - S3
   - API Gateway
   - Cognito
   - EventBridge
   - IAM (for creating roles)

2. **S3 Bucket Name Conflict**: Bucket names must be globally unique. The template uses your account ID to ensure uniqueness.

3. **CloudFormation Stack Errors**: Check the AWS CloudFormation console for detailed error messages.

### Function Errors

1. Check CloudWatch Logs:
   ```bash
   npm run logs -- -f functionName
   ```

2. Test locally first:
   ```bash
   npm run dev
   ```

3. Enable X-Ray tracing in `serverless.yml` for detailed tracing.

## Cost Optimization

### Development Stage

For cost-effective development:
- Use DynamoDB on-demand (already configured)
- Keep functions at 256MB memory (already configured)
- Delete old CloudWatch logs
- Use S3 lifecycle policies for old photos

### Production Stage

For production optimization:
- Consider DynamoDB provisioned capacity if traffic is predictable
- Increase Lambda memory if response times are slow
- Enable S3 Intelligent-Tiering
- Set up CloudWatch alarms for cost monitoring

## Security Considerations

1. **API Gateway**: Already configured with JWT authorization
2. **S3 Bucket**: Already configured with public access blocks
3. **Secrets**: Never commit API keys or tokens to git
4. **IAM Roles**: Follow principle of least privilege (already implemented)

## Next Steps

After deployment:
1. Configure frontend with API URL and Cognito details
2. Set up CI/CD pipeline (GitHub Actions, AWS CodePipeline, etc.)
3. Configure custom domain name for API Gateway
4. Set up monitoring and alerts
5. Configure backup policies for DynamoDB

## Support

For issues:
1. Check CloudWatch Logs
2. Review CloudFormation events
3. Consult AWS documentation
4. Check Serverless Framework documentation

