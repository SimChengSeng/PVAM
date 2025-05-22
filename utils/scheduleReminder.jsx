import * as Notifications from "expo-notifications";

/**
 * Schedule a local reminder before the next service date.
 * @param {Date|string} nextServiceDate - full service date
 * @param {"1d"|"3d"|"7d"} option - offset
 * @returns {Promise<{ reminderId: string, scheduledFor: string } | null>}
 */
export const scheduleReminder = async (nextServiceDate, option) => {
  const offset = {
    "1d": 1,
    "3d": 3,
    "7d": 7,
  }[option];

  if (!offset) return null;

  const serviceDate = new Date(nextServiceDate);
  const reminderDate = new Date(serviceDate.getTime() - offset * 86400000);

  if (reminderDate <= new Date()) {
    console.warn("📭 Skipping past reminder:", reminderDate);
    return null;
  }

  const reminderId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "⏰ Upcoming Maintenance",
      body: `Service is due on ${serviceDate.toISOString().split("T")[0]}`,
      sound: true,
    },
    trigger: {
      type: "date",
      timestamp: reminderDate.getTime(), // in milliseconds
    },
  });

  console.log("📭 Scheduled reminder:", {
    reminderId,
    scheduledFor: reminderDate.toISOString(),
  });

  return {
    reminderId,
    scheduledFor: reminderDate.toISOString(),
  };
};
