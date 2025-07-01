import * as Notifications from "expo-notifications";

/**
 * Schedule a local reminder before the next service date.
 * @param {Date|string} nextServiceDate - full service date
 * @param {"1d"|"3d"|"7d"} option - offset
 * @param {{id: string, plate: string, brand?: string, model?: string}} data
 * @returns {Promise<{ reminderId: string, scheduledFor: string } | null>}
 */
export const scheduleReminder = async (nextServiceDate, option, data = {}) => {
  const offsetDays = { "1d": 1, "3d": 3, "7d": 7 }[option];
  if (!offsetDays) return null;

  const serviceDate = new Date(nextServiceDate);
  const reminderDate = new Date(serviceDate);
  reminderDate.setDate(reminderDate.getDate() - offsetDays);
  reminderDate.setHours(11, 0, 0, 0); // Reminder at 11:00 AM

  const now = new Date();
  if (reminderDate <= now) {
    console.warn("📭 Skipping past reminder:", reminderDate.toISOString());
    return null;
  }

  const reminderId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔧 Maintenance Reminder",
      body: `${data.plate || "Your vehicle"} is due for service on ${
        serviceDate.toISOString().split("T")[0]
      }`,
      data: {
        type: "maintenance",
        screen: "MaintenanceDetailScreen",
        maintenanceId: data.id,
        ...data,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: reminderDate,
    },
  });

  console.log(
    "🔔 Scheduled Reminder:",
    reminderId,
    "for",
    reminderDate.toISOString()
  );

  return {
    reminderId,
    scheduledFor: reminderDate.toISOString(),
  };
};
