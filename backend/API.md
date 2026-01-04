# Kefir Backend API Documentation

Base URL: `https://{api-id}.execute-api.{region}.amazonaws.com`

## Authentication

Most endpoints require authentication via Cognito JWT tokens.

Include the token in the Authorization header:
```
Authorization: Bearer {id_token}
```

## Endpoints

### Batches

#### Create Batch
```
POST /batches
```

**Request Body:**
```json
{
  "name": "Strawberry Kefir",
  "stage": "stage1_open",
  "startDate": "2024-01-15T10:00:00Z",
  "targetDuration": 48,
  "temperature": 22,
  "sugarType": "white sugar",
  "sugarAmount": 50,
  "notes": "First time trying strawberries",
  "isPublic": false,
  "publicNote": "My strawberry kefir experiment"
}
```

**Fields:**
- `name` (required): Batch name (1-100 chars)
- `stage` (required): `stage1_open` or `stage2_bottled`
- `startDate` (optional): ISO 8601 datetime, defaults to now
- `targetDuration` (optional): Duration in hours (1-720)
- `temperature` (optional): Temperature in Celsius (10-40)
- `sugarType` (optional): Type of sugar used
- `sugarAmount` (optional): Amount in grams (0-1000)
- `notes` (optional): Notes about the batch (max 1000 chars)
- `isPublic` (optional): Whether batch is publicly viewable
- `publicNote` (optional): Note for public view (max 500 chars)

**Response:** `201 Created`
```json
{
  "batch": {
    "batchId": "uuid",
    "userId": "user-id",
    "name": "Strawberry Kefir",
    "stage": "stage1_open",
    "status": "active",
    "startDate": "2024-01-15T10:00:00Z",
    ...
  }
}
```

#### List Batches
```
GET /batches?stage=stage1_open&status=active&limit=50
```

**Query Parameters:**
- `stage` (optional): Filter by stage
- `status` (optional): Filter by status (active, in_fridge, ready, archived)
- `limit` (optional): Max results (1-100, default 50)

**Response:** `200 OK`
```json
{
  "batches": [...],
  "count": 5
}
```

#### Get Batch
```
GET /batches/{id}
```

**Response:** `200 OK`
```json
{
  "batch": {...}
}
```

#### Update Batch
```
PUT /batches/{id}
```

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "stage": "stage2_bottled",
  "status": "in_fridge",
  "notes": "Moved to fridge"
}
```

**Response:** `200 OK`

#### Delete Batch
```
DELETE /batches/{id}
```

Archives the batch (soft delete).

**Response:** `200 OK`

---

### Events

#### Create Event
```
POST /batches/{id}/events
```

**Request Body:**
```json
{
  "type": "observation",
  "description": "Bubbles forming nicely",
  "timestamp": "2024-01-15T14:00:00Z",
  "metadata": {
    "carbonation": "medium"
  },
  "photoKey": "optional-s3-key"
}
```

**Event Types:**
- `stage_change`: Stage transition
- `observation`: General observation
- `photo_added`: Photo uploaded
- `status_change`: Status change
- `note`: Simple note

**Response:** `201 Created`

#### List Events
```
GET /batches/{id}/events?limit=50
```

**Response:** `200 OK`
```json
{
  "events": [...],
  "count": 10
}
```

---

### Reminders

#### Get Suggestions
```
GET /batches/{id}/reminders/suggestions
```

Returns AI-generated reminder suggestions based on batch parameters.

**Response:** `200 OK`
```json
{
  "suggestions": [
    {
      "type": "midpoint_check",
      "suggestedTime": "2024-01-16T10:00:00Z",
      "message": "Check your kefir batch (halfway point)",
      "description": "Time to check the fermentation progress"
    }
  ]
}
```

#### Confirm Reminders
```
POST /batches/{id}/reminders/confirm
```

Schedule reminders with EventBridge.

**Request Body:**
```json
{
  "reminders": [
    {
      "scheduledTime": "2024-01-16T10:00:00Z",
      "message": "Check your kefir"
    }
  ]
}
```

**Response:** `201 Created`

#### List User Reminders
```
GET /me/reminders?includeAll=false
```

**Query Parameters:**
- `includeAll` (optional): Include past/cancelled reminders

**Response:** `200 OK`
```json
{
  "reminders": [...],
  "count": 3
}
```

#### Cancel Reminder
```
DELETE /me/reminders/{id}
```

**Response:** `200 OK`

---

### Users & Devices

#### Register Device
```
POST /me/devices
```

Register device for push notifications.

**Request Body:**
```json
{
  "deviceId": "unique-device-id",
  "platform": "ios",
  "token": "fcm-or-apns-token",
  "deviceName": "iPhone 15 Pro",
  "appVersion": "1.0.0"
}
```

**Platforms:**
- `ios`: Apple Push Notification Service
- `android`: Firebase Cloud Messaging

**Response:** `201 Created`

#### List Devices
```
GET /me/devices
```

**Response:** `200 OK`

#### Unregister Device
```
DELETE /me/devices/{id}
```

**Response:** `200 OK`

---

### Export

#### Export Data as CSV
```
GET /export.csv
```

Exports all user data (batches, events, reminders, devices) as CSV.

**Response:** `200 OK`
```
Content-Type: text/csv
Content-Disposition: attachment; filename="kefir-data-{timestamp}.csv"
```

---

### Public (No Auth)

#### View Public Batch
```
GET /public/b/{batchId}
```

No authentication required. Returns limited public information.

**Response:** `200 OK`
```json
{
  "batch": {
    "batchId": "uuid",
    "name": "Strawberry Kefir",
    "stage": "stage1_open",
    "status": "active",
    "startDate": "2024-01-15T10:00:00Z",
    "publicNote": "My strawberry experiment",
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

Returns `403 Forbidden` if batch is not public.

---

## Photo Upload Flow

Photos are uploaded directly to S3 using presigned URLs:

1. **Get Upload URL:**
   ```
   POST /batches/{id}/photo/upload-url
   
   Body:
   {
     "filename": "photo.jpg",
     "contentType": "image/jpeg"
   }
   
   Response:
   {
     "uploadUrl": "https://s3.amazonaws.com/...",
     "photoKey": "users/{userId}/batches/{batchId}/..."
   }
   ```

2. **Upload to S3:**
   ```
   PUT {uploadUrl}
   Content-Type: image/jpeg
   Body: <binary image data>
   ```

3. **Add Photo to Batch:**
   ```
   POST /batches/{id}/photo
   
   Body:
   {
     "photoKey": "users/..."
   }
   ```

4. **Get Photo URLs:**
   ```
   GET /batches/{id}/photos
   
   Response:
   {
     "photoUrls": [
       "https://s3.amazonaws.com/..."
     ]
   }
   ```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

**Status Codes:**
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (no access to resource)
- `404`: Not Found
- `409`: Conflict (duplicate resource)
- `500`: Internal Server Error

---

## Rate Limits

API Gateway has default limits:
- 10,000 requests per second
- 5,000 concurrent requests

Contact AWS support to increase limits.

---

## CORS

CORS is enabled for all origins (`*`).

In production, configure specific origins in `resources/api-gateway.yml`.

---

## Batch Lifecycle

**Stages:**
1. `stage1_open`: First fermentation (open container)
2. `stage2_bottled`: Second fermentation (sealed bottle)

**Statuses:**
1. `active`: Currently fermenting
2. `in_fridge`: Moved to refrigerator
3. `ready`: Ready to consume
4. `archived`: Finished/deleted

**Typical Flow:**
```
Create → active/stage1_open
  ↓
In fridge → in_fridge/stage1_open
  ↓
Bottle → active/stage2_bottled
  ↓
Ready → ready/stage2_bottled
  ↓
Archive → archived
```

---

## Webhooks (Future)

Push notifications are sent when:
- Reminder is triggered
- Batch status changes (optional)
- Fermentation time exceeded (optional)

Currently, only reminder notifications are implemented via EventBridge.

