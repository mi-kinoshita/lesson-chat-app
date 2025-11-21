import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { StoredTask } from './storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
  }),
});

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.error('Failed to get push token for push notification! Make sure permissions are granted.');
    return false;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
  return true;
}

export async function scheduleTaskNotification(task: StoredTask) {
  if (!task.date || task.completed) {
    console.log(`Skipping notification for task '${task.text}': No date or already completed.`);
    return;
  }

  const notificationTime = new Date(`${task.date}T09:00:00`);
  const localNotificationTime = new Date(notificationTime.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));

  const now = new Date();
  if (localNotificationTime.getTime() < now.getTime()) {
    console.log(`Skipping notification for past task '${task.text}'.`);
    return;
  }

  await Notifications.cancelScheduledNotificationAsync(task.id);
  console.log(`Cancelled existing notification for task ID: ${task.id}`);

  const trigger: Notifications.DateTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: localNotificationTime,
    // repeats: false, // この行を削除
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '🗓️ Task Reminder',
      body: `It's time to complete your task: ${task.text}.`,
      data: { taskId: task.id, type: 'task' },
      sound: true,
    },
    trigger,
    identifier: task.id,
  });

  console.log(`Notification scheduled for task '${task.text}' at ${localNotificationTime.toLocaleString()} with ID: ${notificationId}`);
  return notificationId;
}

export async function cancelTaskNotification(taskId: string) {
  try {
    await Notifications.cancelScheduledNotificationAsync(taskId);
    console.log(`Notification cancelled for task ID: ${taskId}`);
  } catch (error) {
    console.error(`Failed to cancel notification for task ID ${taskId}:`, error);
  }
}

export async function scheduleDailyMoodReminder() {
  const reminderId = 'dailyMoodReminder';

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    if (notification.identifier === reminderId) {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
      console.log('Existing daily mood reminder cancelled.');
      break;
    }
  }

  const trigger: Notifications.DailyTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: 20,
    minute: 0,
  };

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'How Are You Feeling?',
      body: 'Quickly log your mood to see how you are feeling and track your journey with Prism.',
      data: { type: 'moodReminder' },
      sound: true,
    },
    trigger,
    identifier: reminderId,
  });

  console.log(`Daily mood reminder scheduled for 20:00 everyday with ID: ${notificationId}`);
  return notificationId;
}

export async function cancelDailyMoodReminder() {
  try {
    await Notifications.cancelScheduledNotificationAsync('dailyMoodReminder');
    console.log('Daily mood reminder cancelled.');
  } catch (error) {
    console.error('Failed to cancel daily mood reminder:', error);
  }
}