# Kefir Backend

Serverless backend API for the Kefir batch management application.

## Architecture

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Serverless Framework
- **Cloud Provider**: AWS
- **Database**: DynamoDB (single-table design)
- **Storage**: S3 (photo storage)
- **Auth**: Cognito User Pool (email OTP)
- **Scheduling**: EventBridge Scheduler

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure AWS credentials:
```bash
aws configure
```

3. Deploy to development:
```bash
npm run deploy:dev
```

## Local Development

Run the API locally with Serverless Offline:

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Project Structure

```
backend/
├── src/
│   ├── functions/     # Lambda function handlers
│   ├── lib/          # Shared libraries (DB, S3, Auth)
│   ├── models/       # Data models and types
│   └── utils/        # Utility functions
├── resources/        # AWS resource definitions
└── local/           # Local development mocks
```

## API Endpoints

### Authenticated Endpoints (require JWT token)
- `POST /batches` - Create new batch
- `GET /batches` - List all user batches
- `GET /batches/:id` - Get batch details
- `POST /batches/:id/events` - Log batch event
- `GET /batches/:id/events` - List batch events
- `GET /batches/:id/reminders/suggestions` - Get reminder suggestions
- `POST /batches/:id/reminders/confirm` - Confirm reminders
- `GET /me/reminders` - List user reminders
- `POST /me/devices` - Register device for notifications
- `GET /export.csv` - Export data as CSV

### Public Endpoints
- `GET /public/b/:batchId` - View batch publicly (no auth)

## Scripts

- `npm run build` - Compile TypeScript
- `npm run dev` - Start local development server
- `npm run deploy` - Deploy to default stage
- `npm run deploy:dev` - Deploy to dev stage
- `npm run deploy:prod` - Deploy to production
- `npm run remove` - Remove deployed stack
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Environment Variables

Set in `serverless.yml` or via AWS Systems Manager Parameter Store:
- `TABLE_NAME` - DynamoDB table name
- `BUCKET_NAME` - S3 bucket name
- `USER_POOL_ID` - Cognito User Pool ID
- `SCHEDULER_GROUP_NAME` - EventBridge Scheduler group name

