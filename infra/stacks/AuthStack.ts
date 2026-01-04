/**
 * Authentication Stack
 * 
 * Sets up AWS Cognito User Pool for passwordless email OTP authentication.
 */

import * as aws from "@pulumi/aws";

export default function AuthStack() {
  // Create Cognito User Pool with email OTP authentication
  const userPool = new aws.cognito.UserPool("KefirUserPool", {
    name: `kefir-app-${$app.stage}`,
    
    // Use email as username
    usernameAttributes: ["email"],
    
    // Auto-verify email
    autoVerifiedAttributes: ["email"],
    
    // Self sign-up enabled
    userAttributeUpdateSettings: {
      attributesRequireVerificationBeforeUpdates: ["email"],
    },
    
    // Account recovery via email
    accountRecoverySetting: {
      recoveryMechanisms: [
        {
          name: "verified_email",
          priority: 1,
        },
      ],
    },
    
    // Password policy (required by Cognito even for OTP)
    passwordPolicy: {
      minimumLength: 8,
      requireLowercase: false,
      requireUppercase: false,
      requireNumbers: false,
      requireSymbols: false,
    },
    
    // Email configuration
    emailConfiguration: {
      emailSendingAccount: "COGNITO_DEFAULT",
      sourceArn: undefined, // Use Cognito's default email
    },
    
    // Verification message templates
    verificationMessageTemplate: {
      defaultEmailOption: "CONFIRM_WITH_CODE",
      emailMessage: "Your Kefir verification code is {####}",
      emailSubject: "Verify your Kefir account",
    },
    
    // MFA configuration - disabled for OTP flow
    mfaConfiguration: "OFF",
    
    // User pool add-ons
    userPoolAddOns: {
      advancedSecurityMode: $app.stage === "prod" ? "ENFORCED" : "OFF",
    },
    
    // Schema
    schemas: [
      {
        name: "email",
        attributeDataType: "String",
        required: true,
        mutable: false,
      },
    ],
    
    // Deletion protection
    deletionProtection: $app.stage === "prod" ? "ACTIVE" : "INACTIVE",
    
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // Create User Pool Client
  const userPoolClient = new aws.cognito.UserPoolClient("KefirUserPoolClient", {
    name: `kefir-app-client-${$app.stage}`,
    userPoolId: userPool.id,
    
    // Token validity
    accessTokenValidity: 60,
    idTokenValidity: 60,
    refreshTokenValidity: 30,
    tokenValidityUnits: {
      accessToken: "minutes",
      idToken: "minutes",
      refreshToken: "days",
    },
    
    // Auth flows
    explicitAuthFlows: [
      "ALLOW_USER_PASSWORD_AUTH",
      "ALLOW_USER_SRP_AUTH",
      "ALLOW_REFRESH_TOKEN_AUTH",
      "ALLOW_CUSTOM_AUTH",
    ],
    
    // Prevent user existence errors
    preventUserExistenceErrors: "ENABLED",
    
    // Read/write attributes
    readAttributes: [
      "email",
      "email_verified",
    ],
    writeAttributes: [
      "email",
    ],
    
    // Enable token revocation
    enableTokenRevocation: true,
    
    // Auth session validity
    authSessionValidity: 3, // 3 minutes
  });
  
  return {
    userPoolId: userPool.id,
    userPoolArn: userPool.arn,
    clientId: userPoolClient.id,
  };
}

