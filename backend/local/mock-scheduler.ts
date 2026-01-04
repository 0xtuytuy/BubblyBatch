/**
 * Mock EventBridge Scheduler
 * 
 * Provides a way to manually trigger reminder processing in local development
 * without relying on EventBridge cron schedules.
 * 
 * Usage:
 *   tsx local/mock-scheduler.ts
 *   curl -X POST http://localhost:3000/admin/trigger-reminders
 */

import { DynamoDBClient, QueryCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";

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

/**
 * Query DynamoDB for due reminders
 */
async function getDueReminders() {
  const now = new Date().toISOString();
  
  try {
    // In production, this would use GSI1 to find all due reminders
    // For local testing, we'll scan for simplicity
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: "#status = :pending AND dueAt <= :now",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: marshall({
        ":pending": "PENDING",
        ":now": now,
      }),
    };
    
    const result = await client.send(new QueryCommand(params as any));
    return result.Items?.map(item => unmarshall(item)) || [];
  } catch (error) {
    console.error("Error querying due reminders:", error);
    throw error;
  }
}

/**
 * Process a single reminder
 */
async function processReminder(reminder: any) {
  console.log(`\n📬 Processing reminder: ${reminder.reminderId}`);
  console.log(`   User: ${reminder.userId}`);
  console.log(`   Batch: ${reminder.batchId}`);
  console.log(`   Message: ${reminder.message}`);
  console.log(`   Due: ${reminder.dueAt}`);
  
  // Mock: Log push notification instead of sending
  console.log(`   [MOCK PUSH] Would send notification to user ${reminder.userId}`);
  
  // Update reminder status
  try {
    await client.send(
      new UpdateItemCommand({
        TableName: TABLE_NAME,
        Key: marshall({
          PK: reminder.PK,
          SK: reminder.SK,
        }),
        UpdateExpression: "SET #status = :sent, sentAt = :sentAt",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: marshall({
          ":sent": "SENT",
          ":sentAt": new Date().toISOString(),
        }),
      })
    );
    console.log(`   ✓ Marked as sent`);
  } catch (error) {
    console.error(`   ✗ Error updating reminder:`, error);
  }
}

/**
 * Main function to check and process reminders
 */
export async function checkReminders() {
  console.log("🔔 Checking for due reminders...");
  console.log(`   Table: ${TABLE_NAME}`);
  console.log(`   Time: ${new Date().toISOString()}\n`);
  
  try {
    const reminders = await getDueReminders();
    
    if (reminders.length === 0) {
      console.log("✓ No due reminders found");
      return { processed: 0 };
    }
    
    console.log(`Found ${reminders.length} due reminder(s)`);
    
    // Process each reminder
    for (const reminder of reminders) {
      await processReminder(reminder);
    }
    
    console.log(`\n✅ Processed ${reminders.length} reminder(s)`);
    return { processed: reminders.length };
  } catch (error) {
    console.error("\n❌ Error checking reminders:", error);
    throw error;
  }
}

/**
 * HTTP handler for triggering via API endpoint
 */
export async function handler(event: any) {
  console.log("Reminder check triggered via API");
  
  try {
    const result = await checkReminders();
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: false,
        error: error.message,
      }),
    };
  }
}

// Run if called directly
if (require.main === module) {
  checkReminders()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

