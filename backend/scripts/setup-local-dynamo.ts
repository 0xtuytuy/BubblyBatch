#!/usr/bin/env tsx

/**
 * Setup Local DynamoDB Tables
 * 
 * Creates DynamoDB tables in local DynamoDB instance with the same schema
 * as production. Run this after starting docker-compose.
 * 
 * Usage:
 *   tsx scripts/setup-local-dynamo.ts
 *   tsx scripts/setup-local-dynamo.ts --reset  # Delete and recreate tables
 */

import {
  DynamoDBClient,
  CreateTableCommand,
  DeleteTableCommand,
  ListTablesCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";

const DYNAMODB_ENDPOINT = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";
const TABLE_NAME = "kefir-local-table";
const RESET = process.argv.includes("--reset");

// Configure DynamoDB client for local instance
const client = new DynamoDBClient({
  endpoint: DYNAMODB_ENDPOINT,
  region: "us-east-1",
  credentials: {
    accessKeyId: "local",
    secretAccessKey: "local",
  },
});

/**
 * Check if table exists
 */
async function tableExists(tableName: string): Promise<boolean> {
  try {
    const result = await client.send(new ListTablesCommand({}));
    return result.TableNames?.includes(tableName) || false;
  } catch (error) {
    console.error("Error checking table existence:", error);
    return false;
  }
}

/**
 * Delete table if it exists
 */
async function deleteTable(tableName: string): Promise<void> {
  try {
    console.log(`Deleting table ${tableName}...`);
    await client.send(new DeleteTableCommand({ TableName: tableName }));
    
    // Wait a bit for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✓ Table ${tableName} deleted`);
  } catch (error: any) {
    if (error.name === "ResourceNotFoundException") {
      console.log(`  Table ${tableName} does not exist`);
    } else {
      console.error(`✗ Error deleting table:`, error);
      throw error;
    }
  }
}

/**
 * Create main Kefir table with single-table design
 */
async function createKefirTable(): Promise<void> {
  console.log(`Creating table ${TABLE_NAME}...`);
  
  try {
    await client.send(
      new CreateTableCommand({
        TableName: TABLE_NAME,
        BillingMode: "PAY_PER_REQUEST",
        
        // Primary key
        KeySchema: [
          { AttributeName: "PK", KeyType: "HASH" },
          { AttributeName: "SK", KeyType: "RANGE" },
        ],
        
        // Attributes (only keys need to be defined)
        AttributeDefinitions: [
          { AttributeName: "PK", AttributeType: "S" },
          { AttributeName: "SK", AttributeType: "S" },
          { AttributeName: "GSI1PK", AttributeType: "S" },
          { AttributeName: "GSI1SK", AttributeType: "S" },
        ],
        
        // Global Secondary Index
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
    
    // Wait for table to be created
    console.log("  Waiting for table to be active...");
    await waitUntilTableExists(
      { client, maxWaitTime: 30 },
      { TableName: TABLE_NAME }
    );
    
    console.log(`✓ Table ${TABLE_NAME} created successfully`);
  } catch (error: any) {
    if (error.name === "ResourceInUseException") {
      console.log(`  Table ${TABLE_NAME} already exists`);
    } else {
      console.error(`✗ Error creating table:`, error);
      throw error;
    }
  }
}

/**
 * Verify table configuration
 */
async function verifyTable(): Promise<void> {
  console.log(`\nVerifying table ${TABLE_NAME}...`);
  
  try {
    const result = await client.send(
      new DescribeTableCommand({ TableName: TABLE_NAME })
    );
    
    const table = result.Table;
    if (!table) {
      console.error("✗ Table not found");
      return;
    }
    
    console.log("✓ Table Configuration:");
    console.log(`  Status: ${table.TableStatus}`);
    console.log(`  Item Count: ${table.ItemCount}`);
    console.log(`  Size: ${table.TableSizeBytes} bytes`);
    console.log(`  Keys: ${table.KeySchema?.map(k => k.AttributeName).join(", ")}`);
    console.log(`  GSIs: ${table.GlobalSecondaryIndexes?.map(g => g.IndexName).join(", ") || "None"}`);
  } catch (error) {
    console.error("✗ Error verifying table:", error);
    throw error;
  }
}

/**
 * Main setup function
 */
async function setup() {
  console.log("🚀 Setting up local DynamoDB tables...\n");
  console.log(`Endpoint: ${DYNAMODB_ENDPOINT}`);
  console.log(`Table Name: ${TABLE_NAME}\n`);
  
  try {
    // Check if DynamoDB Local is running
    try {
      await client.send(new ListTablesCommand({}));
    } catch (error) {
      console.error("✗ Cannot connect to DynamoDB Local");
      console.error("  Make sure Docker is running: docker-compose up -d dynamodb");
      process.exit(1);
    }
    
    // Reset if requested
    if (RESET) {
      console.log("🔄 Reset mode: deleting existing tables\n");
      const exists = await tableExists(TABLE_NAME);
      if (exists) {
        await deleteTable(TABLE_NAME);
      }
    }
    
    // Create table
    const exists = await tableExists(TABLE_NAME);
    if (!exists) {
      await createKefirTable();
    } else {
      console.log(`Table ${TABLE_NAME} already exists. Use --reset to recreate.`);
    }
    
    // Verify
    await verifyTable();
    
    console.log("\n✅ Local DynamoDB setup complete!");
    console.log("\nNext steps:");
    console.log("  1. Seed test data: tsx scripts/seed-dev.ts --local");
    console.log("  2. View tables at: http://localhost:8001");
    console.log("  3. Start local dev: npm run dev");
    
  } catch (error) {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  }
}

// Run setup
setup();

