import {
  SchedulerClient,
  CreateScheduleCommand,
  DeleteScheduleCommand,
  GetScheduleCommand,
  FlexibleTimeWindowMode,
} from '@aws-sdk/client-scheduler';

const IS_OFFLINE = process.env.IS_OFFLINE === 'true';
const SCHEDULER_GROUP_NAME = process.env.SCHEDULER_GROUP_NAME!;

// In-memory storage for offline mode
const offlineSchedules = new Map<string, any>();

const schedulerClient = IS_OFFLINE ? null : new SchedulerClient({});

// ARN of the reminder notification Lambda (from EventBridge resource)
const getTargetLambdaArn = () => {
  const accountId = process.env.AWS_ACCOUNT_ID;
  const stage = process.env.STAGE || 'dev';
  const region = process.env.AWS_REGION || 'us-east-1';
  return `arn:aws:lambda:${region}:${accountId}:function:kefir-reminder-notification-${stage}`;
};

const getSchedulerRoleArn = () => {
  const accountId = process.env.AWS_ACCOUNT_ID;
  const stage = process.env.STAGE || 'dev';
  const region = process.env.AWS_REGION || 'us-east-1';
  return `arn:aws:iam::${accountId}:role/kefir-scheduler-role-${stage}`;
};

export const scheduler = {
  /**
   * Create a scheduled reminder (or mock schedule in offline mode)
   */
  async createReminder(params: {
    reminderId: string;
    userId: string;
    batchId: string;
    scheduleTime: Date;
    message: string;
  }): Promise<string> {
    const scheduleName = `reminder-${params.reminderId}`;

    if (IS_OFFLINE) {
      offlineSchedules.set(scheduleName, {
        ...params,
        scheduleExpression: `at(${params.scheduleTime.toISOString().slice(0, 19)})`,
        createdAt: new Date().toISOString(),
      });
      console.log(`[OFFLINE SCHEDULER] CREATE ${scheduleName} at ${params.scheduleTime.toISOString()}`);
      return `arn:aws:scheduler:local:000000000000:schedule/${SCHEDULER_GROUP_NAME}/${scheduleName}`;
    }

    // Convert to UTC ISO string for schedule expression
    const scheduleExpression = `at(${params.scheduleTime.toISOString().slice(0, 19)})`;

    await schedulerClient!.send(
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
   * Delete a scheduled reminder (or from offline storage)
   */
  async deleteReminder(reminderId: string): Promise<void> {
    const scheduleName = `reminder-${reminderId}`;

    if (IS_OFFLINE) {
      const deleted = offlineSchedules.delete(scheduleName);
      console.log(`[OFFLINE SCHEDULER] DELETE ${scheduleName} - ${deleted ? 'success' : 'not found'}`);
      return;
    }

    try {
      await schedulerClient!.send(
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

    if (IS_OFFLINE) {
      const exists = offlineSchedules.has(scheduleName);
      console.log(`[OFFLINE SCHEDULER] EXISTS ${scheduleName} - ${exists}`);
      return exists;
    }

    try {
      await schedulerClient!.send(
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

