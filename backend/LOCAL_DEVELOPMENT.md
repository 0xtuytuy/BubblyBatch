# Local Development Guide

This guide explains how to run the Kefir backend locally for testing with mobile apps or web browsers.

## Quick Start

```bash
cd backend
npm install
npm run dev
```

The API will be available at:
- **Local machine**: `http://localhost:3000`
- **Network devices**: `http://YOUR_LOCAL_IP:3000`

Your local IP will be displayed in the startup output.

## Prerequisites

- Node.js 18 or higher
- npm (comes with Node.js)

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Start the local server:**
   ```bash
   npm run dev
   ```

## How It Works

When running locally with `npm run dev`:

1. ✅ **No AWS credentials needed** - everything runs in-memory
2. ✅ **No Cognito deployment needed** - authentication is bypassed
3. ✅ **Test data is pre-seeded** - ready to use immediately
4. ✅ **Network accessible** - connect from mobile devices on same WiFi

### Architecture in Offline Mode

```
Mobile/Web App
      ↓
  http://192.168.x.x:3000
      ↓
Serverless Offline (Lambda functions)
      ↓
In-Memory Storage (DynamoDB, S3, EventBridge)
```

## Finding Your Local IP Address

### macOS
```bash
ipconfig getifaddr en0
```

### Linux
```bash
hostname -I | awk '{print $1}'
```

### Windows
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter.

## Authentication in Local Mode

### No JWT Required!

In offline mode, authentication is simplified:

1. **Add X-User-Id header** to specify which test user to use
2. **Or omit the header** to use default test user (test-user-1)

### Example Requests

**With specific user:**
```bash
curl -H "X-User-Id: test-user-1" \
     http://localhost:3000/batches
```

**Without header (uses default):**
```bash
curl http://localhost:3000/batches
```

## Test Data

Pre-seeded test data includes:

### Test Users
- **test-user-1** (alice@example.com)
- **test-user-2** (bob@example.com)

### Test Batches
- **batch-1**: Strawberry Kefir (stage1_open, active) - owned by test-user-1
- **batch-2**: Plain Kefir (stage2_bottled, in_fridge) - owned by test-user-1
- **batch-3**: Blueberry Kefir (stage1_open, active) - owned by test-user-2

### Test Events
- One sample event per batch

### Test Device
- One iOS device registered to test-user-1

## Configuring Your Frontend

### Mobile App (React Native / Expo)

```typescript
// config.ts
export const API_CONFIG = {
  baseURL: __DEV__ 
    ? 'http://192.168.1.100:3000'  // Replace with your local IP
    : 'https://prod-api-url.com',
  headers: __DEV__ ? {
    'X-User-Id': 'test-user-1'
  } : {},
};
```

### Web App

```typescript
// config.ts
const isDevelopment = process.env.NODE_ENV === 'development';

export const API_CONFIG = {
  baseURL: isDevelopment
    ? 'http://localhost:3000'
    : 'https://prod-api-url.com',
  headers: isDevelopment ? {
    'X-User-Id': 'test-user-1'
  } : {},
};
```

## API Endpoints

### Public (No Authentication)

- `GET /public/b/:batchId` - View public batch

### Authenticated (Needs X-User-Id Header)

**Batches:**
- `POST /batches` - Create batch
- `GET /batches` - List user batches
- `GET /batches/:id` - Get batch details

**Events:**
- `POST /batches/:id/events` - Create event
- `GET /batches/:id/events` - List events

**Reminders:**
- `GET /batches/:id/reminders/suggestions` - Get suggestions
- `POST /batches/:id/reminders/confirm` - Schedule reminders
- `GET /me/reminders` - List user reminders

**User/Devices:**
- `POST /me/devices` - Register device

**Export:**
- `GET /export.csv` - Export data as CSV

## Example API Calls

### Create a Batch

```bash
curl -X POST \
  -H "X-User-Id: test-user-1" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Test Batch","stage":"stage1_open","temperature":22}' \
  http://localhost:3000/batches
```

### List Batches

```bash
curl -H "X-User-Id: test-user-1" \
  http://localhost:3000/batches
```

### Create an Event

```bash
curl -X POST \
  -H "X-User-Id: test-user-1" \
  -H "Content-Type: application/json" \
  -d '{"type":"observation","description":"Looks bubbly!"}' \
  http://localhost:3000/batches/batch-1/events
```

### Get Reminder Suggestions

```bash
curl -H "X-User-Id: test-user-1" \
  http://localhost:3000/batches/batch-1/reminders/suggestions
```

## Available Commands

### Start Local Server
```bash
npm run dev
```
Starts the server with test data seeded.

### Clean Data
```bash
npm run local:clean
```
Clears all in-memory data.

### Re-seed Data
```bash
npm run local:seed
```
Re-populates test data.

### Check Linting
```bash
npm run lint
```

### Format Code
```bash
npm run format
```

## Troubleshooting

### Can't Connect from Mobile Device

**Problem:** Mobile app can't reach `http://192.168.x.x:3000`

**Solutions:**

1. **Check WiFi**: Ensure mobile device is on the same network as your computer

2. **Check Firewall**: 
   - **macOS**: System Settings → Network → Firewall → Allow incoming connections
   - **Windows**: Windows Defender Firewall → Allow an app → Node.js
   - **Linux**: `sudo ufw allow 3000/tcp`

3. **Verify Backend Started on 0.0.0.0**:
   Look for this in the startup output:
   ```
   Network: http://192.168.x.x:3000
   ```

4. **Test Connection**:
   ```bash
   # From mobile device's browser
   http://YOUR_LOCAL_IP:3000/public/b/batch-1
   ```

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions:**

1. **Kill existing process**:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Or use a different port**:
   Update `serverless.yml`:
   ```yaml
   custom:
     serverless-offline:
       httpPort: 3001
   ```

### CORS Errors

**Problem:** Browser shows "CORS policy" errors

**Check serverless.yml has CORS configured:**
```yaml
custom:
  serverless-offline:
    corsAllowOrigin: '*'
    corsAllowHeaders: '*'
```

### Data Not Persisting

**Problem:** Created data disappears

**This is expected behavior!** 

In offline mode, all data is stored in memory and is reset when you restart the server.

**To reset data manually:**
```bash
npm run local:clean
npm run local:seed
```

### TypeScript Errors

**Problem:** Type errors when starting server

**Solution:**
```bash
# Rebuild TypeScript
npm run build

# Or clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Can't Find Local IP

**On macOS:**
```bash
ipconfig getifaddr en0  # WiFi
ipconfig getifaddr en1  # Ethernet
```

**On Linux:**
```bash
hostname -I
```

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address"

### Serverless Offline Not Starting

**Problem:** `serverless offline` command fails

**Check:**
1. Dependencies installed: `npm install`
2. Node version: `node --version` (should be 18+)
3. No syntax errors in serverless.yml
4. serverless-offline plugin installed

## Differences from Production

### In Local Mode

| Feature | Local Behavior |
|---------|---------------|
| **Database** | In-memory (resets on restart) |
| **Authentication** | X-User-Id header (no JWT) |
| **S3 Photos** | Mock URLs (not actually stored) |
| **Reminders** | Logged but not triggered |
| **Environment** | IS_OFFLINE=true |

### In Production (AWS)

| Feature | Production Behavior |
|---------|-------------------|
| **Database** | DynamoDB (persistent) |
| **Authentication** | Cognito JWT (validated) |
| **S3 Photos** | Real S3 storage |
| **Reminders** | EventBridge triggers notifications |
| **Environment** | IS_OFFLINE=false |

## Network Security Notes

When running locally with `host: 0.0.0.0`:

⚠️ **The API is accessible to anyone on your local network**

This is fine for development, but:
- Don't expose to public networks
- Don't use on untrusted WiFi
- Don't commit sensitive data

## Switching to AWS Deployment

To deploy to real AWS environment:

```bash
# Deploy to dev
npm run deploy:dev

# Deploy to production
npm run deploy:prod
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for full deployment guide.

## Tips & Best Practices

### 1. Use a Test Device ID

When testing device registration, use a consistent test device ID:
```json
{
  "deviceId": "test-device-ios-1",
  "platform": "ios",
  "token": "fake-token-for-testing"
}
```

### 2. Check Console Logs

The backend logs all offline operations:
```
[OFFLINE DB] PUT USER#test-user-1#USER#test-user-1
[OFFLINE DB] QUERY USER#test-user-1 - found 3 items
[OFFLINE S3] Mock upload URL: users/test-user-1/batches/batch-1/123456.jpg
[OFFLINE SCHEDULER] CREATE reminder-abc123 at 2024-01-15T14:00:00Z
```

### 3. Test Different Users

Switch between users by changing the header:
```bash
# User 1
curl -H "X-User-Id: test-user-1" http://localhost:3000/batches

# User 2
curl -H "X-User-Id: test-user-2" http://localhost:3000/batches
```

### 4. Use Postman/Insomnia

Create a collection with:
- Base URL variable: `{{baseUrl}}`
- Header variable: `{{userId}}`
- Easy switching between local and production

## Getting Help

If you encounter issues:

1. Check this guide
2. Review console output for error messages
3. Try `npm run local:clean && npm run dev`
4. Check [GitHub Issues](link-to-issues)

## Next Steps

- Start your frontend and connect to the local API
- Test all endpoints
- Deploy to AWS when ready (see [DEPLOYMENT.md](DEPLOYMENT.md))

