import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { PushNotificationToken, NotificationPayload } from '../types';

// Configure how notifications should be handled when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request permission to send push notifications
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permissions not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Get the device's push notification token
 */
export const getNotificationToken = async (): Promise<PushNotificationToken | null> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    
    if (!hasPermission) {
      return null;
    }

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'your-project-id',
    });

    const token: PushNotificationToken = {
      token: tokenData.data,
      platform: Platform.OS as 'ios' | 'android' | 'web',
      deviceId: await getDeviceId(),
    };

    return token;
  } catch (error) {
    console.error('Error getting notification token:', error);
    return null;
  }
};

/**
 * Get a unique device identifier
 */
const getDeviceId = async (): Promise<string> => {
  // In production, you might want to use expo-device or expo-application
  // to get a proper device identifier
  return `${Platform.OS}-${Date.now()}`;
};

/**
 * Register the device token with the backend
 * In production, this would send the token to your backend
 */
export const registerDeviceToken = async (token: PushNotificationToken): Promise<boolean> => {
  try {
    // Mock implementation
    // In production, this would be:
    // const response = await fetch(`${API_URL}/notifications/register`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${authToken}`,
    //   },
    //   body: JSON.stringify(token),
    // });
    // return response.ok;

    console.log('Device token registered (mock):', token);
    return true;
  } catch (error) {
    console.error('Error registering device token:', error);
    return false;
  }
};

/**
 * Schedule a local notification
 */
export const scheduleNotification = async (
  title: string,
  body: string,
  data: any,
  triggerSeconds: number = 5
): Promise<string | null> => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: {
        seconds: triggerSeconds,
      },
    });

    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel a scheduled notification
 */
export const cancelNotification = async (notificationId: string): Promise<void> => {
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Error canceling notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling all notifications:', error);
  }
};

/**
 * Get all scheduled notifications
 */
export const getScheduledNotifications = async () => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
};

/**
 * Add a notification received listener
 * Called when a notification is received while app is foregrounded
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add a notification response listener
 * Called when user taps on a notification
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};

/**
 * Remove a notification subscription
 */
export const removeNotificationSubscription = (
  subscription: Notifications.Subscription
) => {
  Notifications.removeNotificationSubscription(subscription);
};

/**
 * Initialize notification system
 * Call this when the app starts
 */
export const initializeNotifications = async (): Promise<PushNotificationToken | null> => {
  try {
    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    
    if (!hasPermission) {
      console.log('Notification permissions denied');
      return null;
    }

    // Get push token
    const token = await getNotificationToken();
    
    if (!token) {
      console.log('Failed to get notification token');
      return null;
    }

    // Register token with backend
    const registered = await registerDeviceToken(token);
    
    if (!registered) {
      console.log('Failed to register device token');
      return null;
    }

    console.log('Notifications initialized successfully');
    return token;
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return null;
  }
};

/**
 * Send a test notification (for development)
 */
export const sendTestNotification = async () => {
  await scheduleNotification(
    'Test Notification',
    'This is a test notification from Bubble Batch',
    { test: true },
    5
  );
};

