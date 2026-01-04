#!/usr/bin/env tsx

/**
 * Reset Local DynamoDB
 * 
 * Deletes all items from local DynamoDB tables for a clean state.
 * Use this when you want to start fresh with testing.
 * 
 * Usage:
 *   tsx scripts/reset-local-db.ts
 *   tsx scripts/reset-local-db.ts --confirm  # Skip confirmation prompt
 */

import {
  DynamoDBClient,
  ScanCommand,
  BatchWriteItemCommand,
  DeleteTableCommand,
  CreateTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import * as readline from "readline";

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
const TABLE_NAME = "kefir-local-table";
const SKIP_CONFIRM = process.argv.includes("--confirm");

// Configure DynamoDB client
const client = new DynamoDBClient({
  endpoint: DYNAMODB_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: "local",
    secretAccessKey: "local",
  },
});

/**
 * Prompt user for confirmation
 */
function confirm(question: string): Promise<boolean> {
  if (SKIP_CONFIRM) {
    return Promise.resolve(true);
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y" || answer.toLowerCase() === "yes");
    });
  });
}

/**
 * Delete all items from table
 */
async function deleteAllItems(): Promise<number> {
  console.log(`Scanning table ${TABLE_NAME}...`);
  
  let deletedCount = 0;
  let lastEvaluatedKey = undefined;
  
  do {
    // Scan for items
    const scanResult = await client.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );
    
    if (!scanResult.Items || scanResult.Items.length === 0) {
      break;
    }
    
    console.log(`  Found ${scanResult.Items.length} items...`);
    
    // Delete in batches of 25 (DynamoDB limit)
    const batches: any[][] = [];
    for (let i = 0; i < scanResult.Items.length; i += 25) {
      batches.push(scanResult.Items.slice(i, i + 25));
    }
    
    for (const batch of batches) {
      await client.send(
        new BatchWriteItemCommand({
          RequestItems: {
            [TABLE_NAME]: batch.map((item) => ({
              DeleteRequest: {
                Key: {
                  PK: item.PK,
                  SK: item.SK,
                },
              },
            })),
          },
        })
      );
      deletedCount += batch.length;
      console.log(`  Deleted ${deletedCount} items...`);
    }
    
    lastEvaluatedKey = scanResult.LastEvaluatedKey;
  } while (lastEvaluatedKey);
  
  return deletedCount;
}

/**
 * Recreate table from scratch
 */
async function recreateTable(): Promise<void> {
  console.log(`\nRecreating table ${TABLE_NAME}...`);
  
  // Delete table
  try {
    await client.send(new DeleteTableCommand({ TableName: TABLE_NAME }));
    console.log("  Table deleted");
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error: any) {
    if (error.name !== "ResourceNotFoundException") {
      throw error;
    }
  }
  
  // Create table
  await client.send(
    new CreateTableCommand({
      TableName: TABLE_NAME,
      BillingMode: "PAY_PER_REQUEST",
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      AttributeDefinitions: [
        { AttributeName: "PK", AttributeType: "S" },
        { AttributeName: "SK", AttributeType: "S" },
        { AttributeName: "GSI1PK", AttributeType: "S" },
        { AttributeName: "GSI1SK", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "GSI1",
          KeySchema: [
            { AttributeName: "GSI1PK", KeyType: "HASH" },
            { AttributeName: "GSI1SK", KeyType: "RANGE" },
          ],
          Projection: {
            ProjectionType: "ALL",
          },
        },
      ],
    })
  );
  
  console.log("  Waiting for table to be active...");
  await waitUntilTableExists(
    { client, maxWaitTime: 30 },
    { TableName: TABLE_NAME }
  );
  
  console.log("  Table recreated");
}

/**
 * Main reset function
 */
async function reset() {
  console.log("🧹 Resetting Local DynamoDB\n");
  console.log(`Endpoint: ${DYNAMODB_ENDPOINT}`);
  console.log(`Table: ${TABLE_NAME}\n`);
  
  try {
    // Check connection
    try {
      await client.send(new ScanCommand({ TableName: TABLE_NAME, Limit: 1 }));
    } catch (error) {
      console.error("✗ Cannot connect to DynamoDB Local");
      console.error("  Make sure Docker is running: docker-compose up -d dynamodb");
      process.exit(1);
    }
    
    // Ask for confirmation
    const shouldProceed = await confirm(
      "⚠️  This will delete ALL data from the local database. Continue?"
    );
    
    if (!shouldProceed) {
      console.log("❌ Reset cancelled");
      process.exit(0);
    }
    
    console.log();
    
    // Choose method: delete items or recreate table
    const method = process.argv.includes("--recreate") ? "recreate" : "delete";
    
    if (method === "recreate") {
      await recreateTable();
    } else {
      const deleted = await deleteAllItems();
      console.log(`\n✓ Deleted ${deleted} items`);
    }
    
    console.log("\n✅ Local database reset complete!");
    console.log("\nNext steps:");
    console.log("  1. Seed fresh data: tsx scripts/seed-dev.ts --local");
    console.log("  2. View at: http://localhost:8001");
    
  } catch (error) {
    console.error("\n❌ Reset failed:", error);
    process.exit(1);
  }
}

// Run reset
reset();

