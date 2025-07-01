import * as Notifications from "expo-notifications";

/**
 * Schedule a local notification 1 minute from now for debugging.
 */
export const scheduleTestReminder = async () => {
  const now = new Date();
  const testTime = new Date(now.getTime() + 60 * 1000); // 1 minute later

  const id = await Notifications.scheduleNotificationAsync({
    content: { title: "Test", body: "This is a test notification." },
    trigger: {
      seconds: 60,
      repeats: false,
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    },
  });

  console.log("🧪 Test reminder scheduled:", {
    reminderId: id,
    time: testTime.toISOString(),
  });

  return id;
};
