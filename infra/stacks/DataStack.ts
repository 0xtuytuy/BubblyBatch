/**
 * Data Stack
 * 
 * Sets up DynamoDB table (single-table design) and S3 bucket for photos.
 * 
 * Local Mode:
 * - When stage === "local", minimal AWS resources are created
 * - Use DynamoDB Local via docker-compose for development
 * - S3 can use real AWS (cheap) or LocalStack (more setup)
 * - Configure via environment variables in .env.local
 */

import * as aws from "@pulumi/aws";
import { isLocalMode, getTableName, getBucketName } from "../lib/config";

export default function DataStack() {
  const isLocal = isLocalMode();
  const tableName = getTableName();
  const bucketName = getBucketName();
  
  // In local mode, we still create AWS resources but won't use them heavily
  // DynamoDB Local runs in Docker, Lambda functions connect to it
  // S3 can use real AWS (minimal cost) or LocalStack
  
  // Create DynamoDB table with single-table design
  const table = new aws.dynamodb.Table("KefirTable", {
    name: tableName,
    billingMode: "PAY_PER_REQUEST", // On-demand billing
    hashKey: "PK",
    rangeKey: "SK",
    
    attributes: [
      { name: "PK", type: "S" },
      { name: "SK", type: "S" },
      { name: "GSI1PK", type: "S" },
      { name: "GSI1SK", type: "S" },
    ],
    
    // Global Secondary Index for alternate access patterns
    globalSecondaryIndexes: [
      {
        name: "GSI1",
        hashKey: "GSI1PK",
        rangeKey: "GSI1SK",
        projectionType: "ALL",
      },
    ],
    
    // Enable point-in-time recovery for production
    pointInTimeRecovery: {
      enabled: $app.stage === "prod",
    },
    
    // Server-side encryption
    serverSideEncryption: {
      enabled: true,
    },
    
    // TTL attribute
    ttl: {
      enabled: true,
      attributeName: "TTL",
    },
    
    // Deletion protection for production
    deletionProtectionEnabled: $app.stage === "prod",
    
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // Create S3 bucket for photo storage
  const bucket = new aws.s3.BucketV2("KefirPhotoBucket", {
    bucket: isLocal 
      ? bucketName
      : `kefir-app-photos-${$app.stage}-${aws.getCallerIdentityOutput().accountId}`,
    
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // Enable versioning for production
  new aws.s3.BucketVersioningV2("KefirPhotoBucketVersioning", {
    bucket: bucket.id,
    versioningConfiguration: {
      status: $app.stage === "prod" ? "Enabled" : "Suspended",
    },
  });
  
  // Block public access
  new aws.s3.BucketPublicAccessBlock("KefirPhotoBucketPublicAccessBlock", {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  });
  
  // Enable encryption
  new aws.s3.BucketServerSideEncryptionConfigurationV2("KefirPhotoBucketEncryption", {
    bucket: bucket.id,
    rules: [
      {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "AES256",
        },
        bucketKeyEnabled: true,
      },
    ],
  });
  
  // CORS configuration for presigned URLs
  new aws.s3.BucketCorsConfigurationV2("KefirPhotoBucketCors", {
    bucket: bucket.id,
    corsRules: [
      {
        allowedHeaders: ["*"],
        allowedMethods: ["GET", "PUT", "POST"],
        allowedOrigins: $app.stage === "prod" 
          ? ["https://bubblebatch.com", "https://*.bubblebatch.com"]
          : ["*"],
        exposeHeaders: ["ETag"],
        maxAgeSeconds: 3000,
      },
    ],
  });
  
  // Lifecycle policy - delete objects after 1 year
  new aws.s3.BucketLifecycleConfigurationV2("KefirPhotoBucketLifecycle", {
    bucket: bucket.id,
    rules: [
      {
        id: "delete-old-photos",
        status: "Enabled",
        expiration: {
          days: 365,
        },
      },
      {
        id: "abort-incomplete-uploads",
        status: "Enabled",
        abortIncompleteMultipartUpload: {
          daysAfterInitiation: 7,
        },
      },
    ],
  });
  
  return {
    tableName: table.name,
    tableArn: table.arn,
    bucketName: bucket.bucket,
    bucketArn: bucket.arn,
    table,
    bucket,
  };
}

