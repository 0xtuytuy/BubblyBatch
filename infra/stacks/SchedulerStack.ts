/**
 * Scheduler Stack
 * 
 * Sets up EventBridge Scheduler for reminder notifications.
 */

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

interface SchedulerStackProps {
  apiStack: {
    url: pulumi.Output<string>;
    apiId: pulumi.Output<string>;
  };
  dataStack: {
    tableName: pulumi.Output<string>;
    tableArn: pulumi.Output<string>;
    bucketName: pulumi.Output<string>;
    bucketArn: pulumi.Output<string>;
  };
}

export default function SchedulerStack(props: SchedulerStackProps) {
  const { apiStack, dataStack } = props;
  
  // Create IAM role for reminder processor Lambda
  const reminderLambdaRole = new aws.iam.Role("ReminderProcessorRole", {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "lambda.amazonaws.com",
          },
        },
      ],
    }),
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // Attach basic Lambda execution policy
  new aws.iam.RolePolicyAttachment("ReminderProcessorBasicExecution", {
    role: reminderLambdaRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
  });
  
  // Create policy for DynamoDB access
  new aws.iam.RolePolicy("ReminderProcessorDynamoPolicy", {
    role: reminderLambdaRole.id,
    policy: pulumi.all([dataStack.tableArn]).apply(([tableArn]) => JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:UpdateItem",
            "dynamodb:Query",
            "dynamodb:Scan",
          ],
          Resource: [
            tableArn,
            `${tableArn}/index/*`,
          ],
        },
      ],
    })),
  });
  
  // Environment variables for reminder processor
  const reminderEnvironment = pulumi.all([
    dataStack.tableName,
  ]).apply(([tableName]) => ({
    TABLE_NAME: tableName,
    STAGE: $app.stage,
    AWS_REGION: aws.getRegionOutput().name,
  }));
  
  // Create Lambda function for processing reminders
  const reminderProcessor = new aws.lambda.Function("ReminderProcessor", {
    name: `kefir-app-${$app.stage}-reminderProcessor`,
    runtime: aws.lambda.Runtime.NodeJS20dX,
    role: reminderLambdaRole.arn,
    handler: "index.handler",
    timeout: 60,
    memorySize: 512,
    architectures: ["arm64"],
    environment: {
      variables: reminderEnvironment,
    },
    code: new pulumi.asset.AssetArchive({
      "index.js": new pulumi.asset.StringAsset(`
        const { DynamoDBClient, QueryCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
        const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
        
        const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
        
        exports.handler = async (event) => {
          console.log("Processing reminders...", JSON.stringify(event));
          
          const tableName = process.env.TABLE_NAME;
          const now = new Date().toISOString();
          
          try {
            // Query for due reminders using GSI1
            // GSI1PK = "REMINDER#DUE", GSI1SK = timestamp
            const queryParams = {
              TableName: tableName,
              IndexName: "GSI1",
              KeyConditionExpression: "GSI1PK = :pk AND GSI1SK <= :now",
              FilterExpression: "#status = :pending",
              ExpressionAttributeNames: {
                "#status": "status",
              },
              ExpressionAttributeValues: marshall({
                ":pk": "REMINDER#DUE",
                ":now": now,
                ":pending": "PENDING",
              }),
            };
            
            const result = await dynamodb.send(new QueryCommand(queryParams));
            const reminders = result.Items?.map(item => unmarshall(item)) || [];
            
            console.log(\`Found \${reminders.length} due reminders\`);
            
            // Process each reminder
            for (const reminder of reminders) {
              try {
                // Send push notification via Expo
                // TODO: Implement actual Expo push notification
                console.log(\`Sending notification for reminder: \${reminder.PK}\`);
                
                // Update reminder status
                await dynamodb.send(new UpdateItemCommand({
                  TableName: tableName,
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
                    ":sentAt": now,
                  }),
                }));
                
                console.log(\`Reminder \${reminder.PK} marked as sent\`);
              } catch (error) {
                console.error(\`Error processing reminder \${reminder.PK}:\`, error);
              }
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({
                processed: reminders.length,
                timestamp: now,
              }),
            };
          } catch (error) {
            console.error("Error processing reminders:", error);
            throw error;
          }
        };
      `),
    }),
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // Create EventBridge rule to trigger every 5 minutes
  const reminderRule = new aws.cloudwatch.EventRule("ReminderScheduleRule", {
    name: `kefir-app-${$app.stage}-reminder-schedule`,
    description: "Trigger reminder processor every 5 minutes",
    scheduleExpression: "rate(5 minutes)",
    state: "ENABLED",
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // Create EventBridge target for the Lambda function
  const reminderTarget = new aws.cloudwatch.EventTarget("ReminderScheduleTarget", {
    rule: reminderRule.name,
    arn: reminderProcessor.arn,
    input: JSON.stringify({
      source: "eventbridge-scheduler",
      action: "process-reminders",
    }),
  });
  
  // Grant EventBridge permission to invoke the Lambda function
  new aws.lambda.Permission("ReminderProcessorEventBridgePermission", {
    action: "lambda:InvokeFunction",
    function: reminderProcessor.name,
    principal: "events.amazonaws.com",
    sourceArn: reminderRule.arn,
  });
  
  // Create CloudWatch Log Group for the reminder processor
  new aws.cloudwatch.LogGroup("ReminderProcessorLogGroup", {
    name: `/aws/lambda/${reminderProcessor.name}`,
    retentionInDays: $app.stage === "prod" ? 30 : 14,
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  return {
    schedulerArn: reminderRule.arn,
    processorArn: reminderProcessor.arn,
    reminderProcessor,
    reminderRule,
  };
}

