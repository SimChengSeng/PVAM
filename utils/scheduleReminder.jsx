import * as Notifications from "expo-notifications";

// Schedule a reminder for the part service
export const scheduleLocalReminder = async (dateTime, title, body) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: new Date(dateTime),
  });
};
// Cancel all scheduled reminders
export const cancelAllLocalReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};
