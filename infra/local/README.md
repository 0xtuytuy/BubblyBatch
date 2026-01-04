# Local Development Mocks

This directory contains mock implementations of AWS services for local development.

## Available Mocks

### Mock Scheduler (`mock-scheduler.ts`)

Replaces EventBridge Scheduler for local testing. Manually triggers reminder processing.

**Usage**:
```bash
# Run manually
tsx local/mock-scheduler.ts

# Or trigger via API (when SST dev is running)
curl -X POST http://localhost:3000/admin/trigger-reminders
```

**What it does**:
- Queries DynamoDB Local for due reminders
- Logs what would be sent as push notifications
- Marks reminders as sent in database

### Mock Push Notifications (`mock-push.ts`)

Replaces Expo Push API for local testing. Logs notifications to console instead of sending them.

**Usage**:
```typescript
import { sendPushNotification } from './local/mock-push';

await sendPushNotification({
  to: 'MOCK_TOKEN_user123',
  title: 'Reminder',
  body: 'Time to check your kefir!',
  data: { batchId: 'batch001' }
});
```

**Environment Variables**:
- `STORE_MOCK_NOTIFICATIONS=true` - Store notifications in DynamoDB for testing
- `IS_LOCAL=true` - Enable mock mode

**Test it**:
```bash
# Send a test notification
tsx local/mock-push.ts user123 "Test message"
```

## Integration with Lambda Functions

Lambda functions automatically detect local mode via environment variables:

```typescript
const isLocal = process.env.IS_LOCAL === 'true';

if (isLocal) {
  // Use mock services
  const pushClient = createMockPushClient();
} else {
  // Use real services
  const pushClient = new Expo();
}
```

## Viewing Mock Data

### DynamoDB Admin UI
Access at http://localhost:8001 after running `docker-compose up`

### View Mock Notifications
```typescript
// Query DynamoDB for mock notifications
PK = "MOCK#NOTIFICATIONS"
```

## Tips

1. **Don't commit mock data** - Reset local DB before testing
2. **Use consistent test IDs** - Makes debugging easier
3. **Check logs** - Mock services log to console
4. **Store receipts** - Enable `STORE_MOCK_NOTIFICATIONS` to verify delivery

