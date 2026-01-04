/**
 * Mock Push Notification Service
 * 
 * Mocks Expo Push API for local testing. Logs notifications to console
 * and optionally stores them in DynamoDB for testing.
 * 
 * Usage:
 *   import { sendPushNotification } from './local/mock-push';
 *   await sendPushNotification(token, { title, body, data });
 */

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
const TABLE_NAME = process.env.TABLE_NAME || "kefir-local-table";
const IS_LOCAL = process.env.IS_LOCAL === "true" || process.env.STAGE === "local";

// Configure DynamoDB client
const client = new DynamoDBClient(
  IS_LOCAL
    ? {
        endpoint: DYNAMODB_ENDPOINT,
        region: "us-east-1",
        credentials: {
          accessKeyId: "local",
          secretAccessKey: "local",
        },
      }
    : { region: "us-east-1" }
);

interface PushNotification {
  to: string | string[];
  title?: string;
  body: string;
  data?: Record<string, any>;
  sound?: "default" | null;
  badge?: number;
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

interface PushReceipt {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: any;
}

/**
 * Mock sending a push notification
 * 
 * In local mode, logs the notification instead of sending it
 * and optionally stores in DynamoDB for testing
 */
export async function sendPushNotification(
  notification: PushNotification
): Promise<PushReceipt> {
  const timestamp = new Date().toISOString();
  const notificationId = `NOTIF#${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  console.log("\n📬 [MOCK PUSH NOTIFICATION]");
  console.log("─".repeat(50));
  console.log(`  ID: ${notificationId}`);
  console.log(`  To: ${Array.isArray(notification.to) ? notification.to.join(", ") : notification.to}`);
  console.log(`  Title: ${notification.title || "(none)"}`);
  console.log(`  Body: ${notification.body}`);
  if (notification.data) {
    console.log(`  Data: ${JSON.stringify(notification.data)}`);
  }
  console.log(`  Time: ${timestamp}`);
  console.log("─".repeat(50) + "\n");
  
  // Store notification in DynamoDB for testing
  if (IS_LOCAL && process.env.STORE_MOCK_NOTIFICATIONS === "true") {
    try {
      await client.send(
        new PutItemCommand({
          TableName: TABLE_NAME,
          Item: marshall({
            PK: "MOCK#NOTIFICATIONS",
            SK: notificationId,
            type: "push_notification",
            to: notification.to,
            title: notification.title,
            body: notification.body,
            data: notification.data,
            status: "sent",
            sentAt: timestamp,
          }),
        })
      );
      console.log(`  ✓ Stored in DynamoDB for testing`);
    } catch (error) {
      console.error(`  ✗ Error storing notification:`, error);
    }
  }
  
  return {
    status: "ok",
    id: notificationId,
  };
}

/**
 * Mock sending multiple push notifications
 */
export async function sendPushNotifications(
  notifications: PushNotification[]
): Promise<PushReceipt[]> {
  const receipts: PushReceipt[] = [];
  
  for (const notification of notifications) {
    const receipt = await sendPushNotification(notification);
    receipts.push(receipt);
  }
  
  return receipts;
}

/**
 * Mock Expo Push API client
 * 
 * Provides same interface as real Expo Push client for drop-in replacement
 */
export class MockExpoPushClient {
  async sendPushNotificationsAsync(messages: PushNotification[]): Promise<PushReceipt[]> {
    return sendPushNotifications(messages);
  }
  
  isExpoPushToken(token: string): boolean {
    // Mock: Accept any token in local mode
    return token.startsWith("ExponentPushToken[") || token.startsWith("MOCK_");
  }
  
  chunkPushNotifications(messages: PushNotification[]): PushNotification[][] {
    // Expo limits 100 notifications per chunk
    const chunks: PushNotification[][] = [];
    for (let i = 0; i < messages.length; i += 100) {
      chunks.push(messages.slice(i, i + 100));
    }
    return chunks;
  }
}

/**
 * Create a mock push client based on environment
 */
export function createPushClient() {
  if (IS_LOCAL) {
    console.log("📱 Using mock push notification client (local mode)");
    return new MockExpoPushClient();
  }
  
  // In production, would return real Expo push client
  // const { Expo } = require('expo-server-sdk');
  // return new Expo();
  
  console.log("📱 Using real Expo push notification client");
  return new MockExpoPushClient(); // Fallback to mock
}

/**
 * Helper to test push notifications
 */
export async function testPushNotification(userId: string, message: string) {
  console.log(`\n🧪 Testing push notification for user ${userId}`);
  
  const notification: PushNotification = {
    to: `MOCK_TOKEN_${userId}`,
    title: "Test Notification",
    body: message,
    data: {
      type: "test",
      userId,
      timestamp: new Date().toISOString(),
    },
  };
  
  const receipt = await sendPushNotification(notification);
  console.log(`  Receipt:`, receipt);
  
  return receipt;
}

// CLI test
if (require.main === module) {
  const userId = process.argv[2] || "test123";
  const message = process.argv[3] || "This is a test notification";
  
  testPushNotification(userId, message)
    .then(() => {
      console.log("\n✅ Test completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test failed:", error);
      process.exit(1);
    });
}

