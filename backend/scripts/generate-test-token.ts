#!/usr/bin/env tsx

/**
 * Generate Test Auth Token
 * 
 * Generates a Cognito JWT token for testing API endpoints locally.
 * Uses real AWS Cognito with test user credentials.
 * 
 * Usage:
 *   tsx scripts/generate-test-token.ts test@example.com TestPass123!
 *   tsx scripts/generate-test-token.ts  # Uses default test user
 */

import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";

const USER_POOL_ID = process.env.USER_POOL_ID;
const CLIENT_ID = process.env.CLIENT_ID;
const AWS_REGION = process.env.AWS_REGION || "us-east-1";

// Default test credentials
const DEFAULT_EMAIL = "test@example.com";
const DEFAULT_PASSWORD = "TestPass123!";

// Get credentials from args or use defaults
const email = process.argv[2] || DEFAULT_EMAIL;
const password = process.argv[3] || DEFAULT_PASSWORD;

const client = new CognitoIdentityProviderClient({ region: AWS_REGION });

/**
 * Authenticate and get tokens
 */
async function generateToken() {
  console.log("🔐 Generating auth token...\n");
  console.log(`User Pool ID: ${USER_POOL_ID || "(not set)"}`);
  console.log(`Client ID: ${CLIENT_ID || "(not set)"}`);
  console.log(`Email: ${email}\n`);
  
  if (!USER_POOL_ID || !CLIENT_ID) {
    console.error("❌ Error: USER_POOL_ID and CLIENT_ID must be set");
    console.error("\nSet them in your environment:");
    console.error("  export USER_POOL_ID=us-east-1_xxxxx");
    console.error("  export CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx");
    console.error("\nOr get them from deployment output:");
    console.error("  npm run deploy:dev");
    process.exit(1);
  }
  
  try {
    // Authenticate with username and password
    const authResult = await client.send(
      new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: CLIENT_ID,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })
    );
    
    if (!authResult.AuthenticationResult) {
      throw new Error("Authentication failed - no tokens returned");
    }
    
    const {
      IdToken,
      AccessToken,
      RefreshToken,
      ExpiresIn,
    } = authResult.AuthenticationResult;
    
    console.log("✅ Authentication successful!\n");
    console.log("─".repeat(70));
    console.log("\n📋 TOKENS:\n");
    console.log(`ID Token:`);
    console.log(`${IdToken}\n`);
    console.log(`Access Token:`);
    console.log(`${AccessToken}\n`);
    console.log(`Refresh Token:`);
    console.log(`${RefreshToken}\n`);
    console.log("─".repeat(70));
    console.log(`\nExpires in: ${ExpiresIn} seconds (${Math.round(ExpiresIn! / 60)} minutes)\n`);
    
    // Export commands
    console.log("💾 Export to environment:\n");
    console.log(`export ID_TOKEN="${IdToken}"`);
    console.log(`export ACCESS_TOKEN="${AccessToken}"`);
    console.log(`export REFRESH_TOKEN="${RefreshToken}"\n`);
    
    // Test curl command
    console.log("🧪 Test with curl:\n");
    console.log(`curl -H "Authorization: Bearer ${IdToken}" \\`);
    console.log(`     http://localhost:3000/batches\n`);
    
    // Save to file (optional)
    if (process.argv.includes("--save")) {
      const fs = require("fs");
      const tokens = {
        idToken: IdToken,
        accessToken: AccessToken,
        refreshToken: RefreshToken,
        expiresIn: ExpiresIn,
        generatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(".test-tokens.json", JSON.stringify(tokens, null, 2));
      console.log("💾 Tokens saved to .test-tokens.json\n");
    }
    
  } catch (error: any) {
    console.error("❌ Authentication failed:", error.message);
    
    if (error.name === "NotAuthorizedException") {
      console.error("\n💡 Possible reasons:");
      console.error("  - Incorrect username or password");
      console.error("  - User doesn't exist");
      console.error("  - User not confirmed");
    } else if (error.name === "UserNotFoundException") {
      console.error("\n💡 User not found. Create test user:");
      console.error(`  aws cognito-idp admin-create-user \\`);
      console.error(`    --user-pool-id ${USER_POOL_ID} \\`);
      console.error(`    --username ${email} \\`);
      console.error(`    --temporary-password TempPass123! \\`);
      console.error(`    --message-action SUPPRESS`);
    }
    
    process.exit(1);
  }
}

// Run
generateToken();

