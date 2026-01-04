import {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
  GetScheduleCommand,
  FlexibleTimeWindowMode,
} from '@aws-sdk/client-scheduler';

const schedulerClient = new SchedulerClient({});
const SCHEDULER_GROUP_NAME = process.env.SCHEDULER_GROUP_NAME!;

// ARN of the reminder notification Lambda (from EventBridge resource)
const getTargetLambdaArn = () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accountId = process.env.AWS_ACCOUNT_ID;
  const stage = process.env.STAGE || 'dev';
  return `arn:aws:lambda:${region}:${accountId}:function:kefir-reminder-notification-${stage}`;
};

const getSchedulerRoleArn = () => {
  const region = process.env.AWS_REGION || 'us-east-1';
  const accountId = process.env.AWS_ACCOUNT_ID;
  const stage = process.env.STAGE || 'dev';
  return `arn:aws:iam::${accountId}:role/kefir-scheduler-role-${stage}`;
};

export const scheduler = {
  /**
   * Create a scheduled reminder
   */
  async createReminder(params: {
    reminderId: string;
    userId: string;
    batchId: string;
    scheduleTime: Date;
    message: string;
  }): Promise<string> {
    const scheduleName = `reminder-${params.reminderId}`;

    // Convert to UTC ISO string for schedule expression
    const scheduleExpression = `at(${params.scheduleTime.toISOString().slice(0, 19)})`;

    await schedulerClient.send(
      new CreateScheduleCommand({
        Name: scheduleName,
        GroupName: SCHEDULER_GROUP_NAME,
        ScheduleExpression: scheduleExpression,
        FlexibleTimeWindow: {
          Mode: FlexibleTimeWindowMode.OFF,
        },
        Target: {
          Arn: getTargetLambdaArn(),
          RoleArn: getSchedulerRoleArn(),
          Input: JSON.stringify({
            reminderId: params.reminderId,
            userId: params.userId,
            batchId: params.batchId,
            message: params.message,
          }),
        },
        State: 'ENABLED',
      })
    );

    return `arn:aws:scheduler:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:schedule/${SCHEDULER_GROUP_NAME}/${scheduleName}`;
  },

  /**
   * Delete a scheduled reminder
   */
  async deleteReminder(reminderId: string): Promise<void> {
    const scheduleName = `reminder-${reminderId}`;

    try {
      await schedulerClient.send(
        new DeleteScheduleCommand({
          Name: scheduleName,
          GroupName: SCHEDULER_GROUP_NAME,
        })
      );
    } catch (error: any) {
      // Ignore if schedule doesn't exist
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
    }
  },

  /**
   * Check if a reminder schedule exists
   */
  async reminderExists(reminderId: string): Promise<boolean> {
    const scheduleName = `reminder-${reminderId}`;

    try {
      await schedulerClient.send(
        new GetScheduleCommand({
          Name: scheduleName,
          GroupName: SCHEDULER_GROUP_NAME,
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === 'ResourceNotFoundException') {
        return false;
      }
      throw error;
    }
  },
};

