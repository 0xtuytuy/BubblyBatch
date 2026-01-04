/**
 * Seed Development Data
 * 
 * This script populates the dev environment with test data for development.
 * 
 * Usage:
 *   tsx scripts/seed-dev.ts          # Seed AWS dev environment
 *   tsx scripts/seed-dev.ts --local  # Seed local DynamoDB
 */

import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";

const IS_LOCAL = process.argv.includes("--local");
const TABLE_NAME = IS_LOCAL 
  ? "kefir-local-table"
  : (process.env.TABLE_NAME || "kefir-app-dev-table");

// Configure client for local or AWS
const client = new DynamoDBClient(
  IS_LOCAL
    ? {
        endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
        region: "us-east-1",
        credentials: {
          accessKeyId: "local",
          secretAccessKey: "local",
        },
      }
    : { region: "us-east-1" }
);

interface SeedData {
  PK: string;
  SK: string;
  GSI1PK?: string;
  GSI1SK?: string;
  [key: string]: any;
}

const seedData: SeedData[] = [
  // Test User
  {
    PK: "USER#test123",
    SK: "METADATA",
    userId: "test123",
    email: "test@example.com",
    name: "Test User",
    createdAt: new Date().toISOString(),
  },
  
  // Sample Batch 1 (Active, Stage 1)
  {
    PK: "USER#test123",
    SK: "BATCH#batch001",
    GSI1PK: "BATCH#batch001",
    GSI1SK: "STATUS#active",
    batchId: "batch001",
    userId: "test123",
    name: "Summer Lemon Kefir",
    stage: 1,
    status: "active",
    waterVolumeMl: 1000,
    sugarGrams: 75,
    fruits: "lemon, ginger",
    temperatureC: 24,
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    targetHoursStage1: 48,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // Sample Batch 2 (In Fridge, Stage 2)
  {
    PK: "USER#test123",
    SK: "BATCH#batch002",
    GSI1PK: "BATCH#batch002",
    GSI1SK: "STATUS#in_fridge",
    batchId: "batch002",
    userId: "test123",
    name: "Berry Blast",
    stage: 2,
    status: "in_fridge",
    waterVolumeMl: 1500,
    sugarGrams: 100,
    fruits: "strawberry, blueberry",
    temperatureC: 22,
    startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    targetHoursStage1: 48,
    bottleCount: 3,
    temperatureCStage2: 20,
    startTimeStage2: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    targetHoursStage2: 120,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  
  // Event for Batch 1
  {
    PK: "BATCH#batch001",
    SK: `EVENT#${new Date().toISOString()}`,
    eventId: "event001",
    batchId: "batch001",
    type: "note",
    note: "Started fermentation, bubbles forming nicely",
    createdAt: new Date().toISOString(),
  },
  
  // Reminder for Batch 1
  {
    PK: "BATCH#batch001",
    SK: "REMINDER#reminder001",
    GSI1PK: "USER#test123",
    GSI1SK: `DUE#${new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()}`,
    reminderId: "reminder001",
    batchId: "batch001",
    userId: "test123",
    message: "Time to bottle your Summer Lemon Kefir!",
    dueAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
    status: "pending",
    createdAt: new Date().toISOString(),
  },
];

async function seed() {
  console.log(`🌱 Seeding ${IS_LOCAL ? "local" : "AWS"} data to table: ${TABLE_NAME}`);
  if (IS_LOCAL) {
    console.log(`   Endpoint: ${process.env.DYNAMODB_ENDPOINT || "http://localhost:8000"}\n`);
  }
  
  for (const item of seedData) {
    try {
      const command = new PutItemCommand({
        TableName: TABLE_NAME,
        Item: marshall(item),
      });
      
      await client.send(command);
      console.log(`✅ Added: ${item.PK} / ${item.SK}`);
    } catch (error) {
      console.error(`❌ Failed to add ${item.PK} / ${item.SK}:`, error);
    }
  }
  
  console.log("\n✨ Seeding complete!");
  console.log("\nTest credentials:");
  console.log("  Email: test@example.com");
  console.log("  User ID: test123");
  console.log("\nSample batches:");
  console.log("  - batch001: Summer Lemon Kefir (active)");
  console.log("  - batch002: Berry Blast (in fridge)");
}

// Run seed
seed().catch((error) => {
  console.error("Error seeding data:", error);
  process.exit(1);
});

