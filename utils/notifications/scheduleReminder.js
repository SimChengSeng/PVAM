import * as Notifications from "expo-notifications";

export const scheduleReminder = async (nextServiceDate, option, data = {}) => {
  const offsetDays = { "1d": 1, "3d": 3, "7d": 7 }[option];
  if (!offsetDays) return null;

  const serviceDate = new Date(nextServiceDate);
  const reminderDate = new Date(serviceDate.getTime() - offsetDays * 86400000);
  reminderDate.setHours(9, 0, 0, 0); // 9 AM local

  const now = new Date();
  if (reminderDate <= now) {
    console.warn("⏩ Skipping reminder in the past:", reminderDate);
    return null;
  }

  const reminderId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔧 Maintenance Reminder`,
      body: `${
        data.plate || "Your vehicle"
      } needs service on ${serviceDate.toDateString()}`,
      data: {
        screen: "MaintenanceDetailScreen",
        maintenanceId: data.id,
        ...data,
      },
    },
    trigger: {
      date: reminderDate,
    },
  });

  console.log(
    "📆 Scheduled reminder:",
    option,
    "→",
    reminderDate.toISOString()
  );
  return {
    reminderId,
    scheduledFor: reminderDate.toISOString(),
  };
};

/**
 * Schedule a local reminder before the next service date.
 * @param {Date|string} nextServiceDate
 * @param {"1d"|"3d"|"7d"} option
 * @param {{ id: string, plate: string, brand?: string, model?: string }} data
 * @returns {Promise<{ reminderId: string, scheduledFor: string } | null>}
 */
