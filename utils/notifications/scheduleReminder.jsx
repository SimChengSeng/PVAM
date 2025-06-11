import * as Notifications from "expo-notifications";

/**
 * Schedule a local reminder before the next service date.
 * @param {Date|string} nextServiceDate - full service date
 * @param {"1d"|"3d"|"7d"} option - offset
 * @param {{id: string, plate: string, brand?: string, model?: string}} data - navigation info
 * @returns {Promise<{ reminderId: string, scheduledFor: string } | null>}
 */
export const scheduleReminder = async (nextServiceDate, option, data = {}) => {
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
      title: `🔧 Maintenance Reminder`,
      body: `${data.plate || "Your vehicle"} is due for service on ${
        serviceDate.toISOString().split("T")[0]
      }`,
      data: {
        type: "maintenance",
        screen: "MaintenanceDetailScreen",
        maintenanceId: data.id,
        plate: data.plate,
        brand: data.brand,
        model: data.model,
      },
    },
    trigger: {
      type: "date",
      timestamp: reminderDate.getTime(),
    },
  });

  return {
    reminderId,
    scheduledFor: reminderDate.toISOString(),
  };
};
