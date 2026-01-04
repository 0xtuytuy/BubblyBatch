/**
 * Monitoring Stack
 * 
 * Sets up CloudWatch alarms and logging for production environment.
 */

import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

interface MonitoringStackProps {
  apiStack: {
    url: pulumi.Output<string>;
    apiId: pulumi.Output<string>;
    functions: {
      handleAuth: aws.lambda.Function;
      handleBatches: aws.lambda.Function;
      handleEvents: aws.lambda.Function;
      handleReminders: aws.lambda.Function;
      handleDevices: aws.lambda.Function;
      handleExport: aws.lambda.Function;
      handlePublic: aws.lambda.Function;
    };
  };
  dataStack: {
    tableName: pulumi.Output<string>;
    tableArn: pulumi.Output<string>;
    bucketName: pulumi.Output<string>;
    bucketArn: pulumi.Output<string>;
  };
}

export default function MonitoringStack(props: MonitoringStackProps) {
  const { apiStack, dataStack } = props;
  
  // Create SNS topic for alerts (optional)
  const alertTopic = new aws.sns.Topic("KefirAlertTopic", {
    name: `kefir-app-${$app.stage}-alerts`,
    displayName: `Kefir App ${$app.stage} Alerts`,
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // Lambda function names for alarms
  const lambdaFunctions = Object.values(apiStack.functions);
  
  // Create CloudWatch alarms for each Lambda function
  lambdaFunctions.forEach((lambda, index) => {
    // Lambda Errors Alarm
    new aws.cloudwatch.MetricAlarm(`LambdaErrorsAlarm-${index}`, {
      name: pulumi.interpolate`${lambda.name}-errors`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "Errors",
      namespace: "AWS/Lambda",
      period: 60,
      statistic: "Sum",
      threshold: 10,
      treatMissingData: "notBreaching",
      dimensions: {
        FunctionName: lambda.name,
      },
      alarmDescription: pulumi.interpolate`Alert when ${lambda.name} has more than 10 errors in 2 minutes`,
      alarmActions: [alertTopic.arn],
      tags: {
        Environment: $app.stage,
        Application: "kefir-app",
      },
    });
    
    // Lambda Throttles Alarm
    new aws.cloudwatch.MetricAlarm(`LambdaThrottlesAlarm-${index}`, {
      name: pulumi.interpolate`${lambda.name}-throttles`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 1,
      metricName: "Throttles",
      namespace: "AWS/Lambda",
      period: 60,
      statistic: "Sum",
      threshold: 5,
      treatMissingData: "notBreaching",
      dimensions: {
        FunctionName: lambda.name,
      },
      alarmDescription: pulumi.interpolate`Alert when ${lambda.name} is throttled`,
      alarmActions: [alertTopic.arn],
      tags: {
        Environment: $app.stage,
        Application: "kefir-app",
      },
    });
    
    // Lambda Duration Alarm (warn if taking too long)
    new aws.cloudwatch.MetricAlarm(`LambdaDurationAlarm-${index}`, {
      name: pulumi.interpolate`${lambda.name}-duration`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "Duration",
      namespace: "AWS/Lambda",
      period: 300,
      statistic: "Average",
      threshold: 10000, // 10 seconds
      treatMissingData: "notBreaching",
      dimensions: {
        FunctionName: lambda.name,
      },
      alarmDescription: pulumi.interpolate`Alert when ${lambda.name} average duration exceeds 10 seconds`,
      alarmActions: [alertTopic.arn],
      tags: {
        Environment: $app.stage,
        Application: "kefir-app",
      },
    });
  });
  
  // API Gateway 5xx Errors Alarm
  const api5xxAlarm = new aws.cloudwatch.MetricAlarm("ApiGateway5xxAlarm", {
    name: `kefir-app-${$app.stage}-api-5xx-errors`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "5XXError",
    namespace: "AWS/ApiGateway",
    period: 60,
    statistic: "Sum",
    threshold: 10,
    treatMissingData: "notBreaching",
    dimensions: {
      ApiId: apiStack.apiId,
    },
    alarmDescription: "Alert when API Gateway has more than 10 5xx errors in 2 minutes",
    alarmActions: [alertTopic.arn],
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // API Gateway 4xx Errors Alarm (informational)
  const api4xxAlarm = new aws.cloudwatch.MetricAlarm("ApiGateway4xxAlarm", {
    name: `kefir-app-${$app.stage}-api-4xx-errors`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 2,
    metricName: "4XXError",
    namespace: "AWS/ApiGateway",
    period: 300,
    statistic: "Sum",
    threshold: 100,
    treatMissingData: "notBreaching",
    dimensions: {
      ApiId: apiStack.apiId,
    },
    alarmDescription: "Alert when API Gateway has more than 100 4xx errors in 5 minutes",
    alarmActions: [alertTopic.arn],
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // DynamoDB Throttling Alarms
  const dynamoReadThrottleAlarm = new aws.cloudwatch.MetricAlarm("DynamoReadThrottleAlarm", {
    name: `kefir-app-${$app.stage}-dynamo-read-throttles`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "ReadThrottleEvents",
    namespace: "AWS/DynamoDB",
    period: 60,
    statistic: "Sum",
    threshold: 5,
    treatMissingData: "notBreaching",
    dimensions: {
      TableName: dataStack.tableName,
    },
    alarmDescription: "Alert when DynamoDB read throttling occurs",
    alarmActions: [alertTopic.arn],
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  const dynamoWriteThrottleAlarm = new aws.cloudwatch.MetricAlarm("DynamoWriteThrottleAlarm", {
    name: `kefir-app-${$app.stage}-dynamo-write-throttles`,
    comparisonOperator: "GreaterThanThreshold",
    evaluationPeriods: 1,
    metricName: "WriteThrottleEvents",
    namespace: "AWS/DynamoDB",
    period: 60,
    statistic: "Sum",
    threshold: 5,
    treatMissingData: "notBreaching",
    dimensions: {
      TableName: dataStack.tableName,
    },
    alarmDescription: "Alert when DynamoDB write throttling occurs",
    alarmActions: [alertTopic.arn],
    tags: {
      Environment: $app.stage,
      Application: "kefir-app",
    },
  });
  
  // Create CloudWatch Dashboard
  const dashboard = new aws.cloudwatch.Dashboard("KefirDashboard", {
    dashboardName: `kefir-app-${$app.stage}`,
    dashboardBody: pulumi.all([apiStack.apiId, dataStack.tableName]).apply(([apiId, tableName]) => 
      JSON.stringify({
        widgets: [
          {
            type: "metric",
            properties: {
              title: "API Gateway Requests",
              metrics: [
                ["AWS/ApiGateway", "Count", { stat: "Sum", label: "Total Requests" }],
                [".", "4XXError", { stat: "Sum", label: "4xx Errors" }],
                [".", "5XXError", { stat: "Sum", label: "5xx Errors" }],
              ],
              period: 300,
              stat: "Sum",
              region: aws.getRegionOutput().name,
              yAxis: {
                left: {
                  min: 0,
                },
              },
              view: "timeSeries",
              stacked: false,
            },
          },
          {
            type: "metric",
            properties: {
              title: "Lambda Invocations",
              metrics: lambdaFunctions.slice(0, 5).map((fn) => 
                ["AWS/Lambda", "Invocations", { FunctionName: fn.name, stat: "Sum" }]
              ),
              period: 300,
              stat: "Sum",
              region: aws.getRegionOutput().name,
              view: "timeSeries",
              stacked: false,
            },
          },
          {
            type: "metric",
            properties: {
              title: "Lambda Errors",
              metrics: lambdaFunctions.slice(0, 5).map((fn) => 
                ["AWS/Lambda", "Errors", { FunctionName: fn.name, stat: "Sum" }]
              ),
              period: 300,
              stat: "Sum",
              region: aws.getRegionOutput().name,
              view: "timeSeries",
              stacked: false,
            },
          },
          {
            type: "metric",
            properties: {
              title: "DynamoDB Operations",
              metrics: [
                ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { TableName: tableName, stat: "Sum" }],
                [".", "ConsumedWriteCapacityUnits", { TableName: tableName, stat: "Sum" }],
              ],
              period: 300,
              stat: "Sum",
              region: aws.getRegionOutput().name,
              view: "timeSeries",
              stacked: false,
            },
          },
          {
            type: "metric",
            properties: {
              title: "DynamoDB Latency",
              metrics: [
                ["AWS/DynamoDB", "SuccessfulRequestLatency", { TableName: tableName, Operation: "GetItem", stat: "Average" }],
                ["...", { Operation: "PutItem" }],
                ["...", { Operation: "Query" }],
              ],
              period: 300,
              stat: "Average",
              region: aws.getRegionOutput().name,
              view: "timeSeries",
              stacked: false,
            },
          },
        ],
      })
    ),
  });
  
  return {
    dashboardUrl: pulumi.interpolate`https://console.aws.amazon.com/cloudwatch/home?region=${aws.getRegionOutput().name}#dashboards:name=${dashboard.dashboardName}`,
    alertTopicArn: alertTopic.arn,
    dashboard,
    alertTopic,
  };
}

