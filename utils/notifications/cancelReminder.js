import * as Notifications from "expo-notifications";

/**
 * Cancel a scheduled reminder by ID
 * @param {string} reminderId - ID returned by scheduleNotificationAsync
 * @returns {Promise<void>}
 */
export const cancelReminder = async (reminderId) => {
  try {
    await Notifications.cancelScheduledNotificationAsync(reminderId);
    console.log("🗑 Reminder cancelled:", reminderId);
  } catch (error) {
    console.error("❌ Failed to cancel reminder:", error);
  }
};
