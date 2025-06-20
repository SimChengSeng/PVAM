import * as Notifications from "expo-notifications";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";

/**
 * Schedule a weekly local reminder and store metadata in Firestore.
 * @param {string} weekday - "Monday" to "Sunday"
 * @param {string} plate - vehicle plate
 * @param {string} brand - vehicle brand
 * @param {string} model - vehicle model
 * @param {string} vehicleId - Firestore document ID for the vehicle
 */
export const scheduleWeeklyReminder = async (
  weekday,
  plate,
  brand,
  model,
  vehicleId
) => {
  const weekdays = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
  };
  const weekdayNum = weekdays[weekday];
  if (weekdayNum === undefined) return;

  const now = new Date();
  const triggerDate = new Date();
  triggerDate.setDate(
    now.getDate() + ((7 + weekdayNum - now.getDay()) % 7 || 7)
  );
  triggerDate.setHours(9, 0, 0, 0);

  const trigger = {
    weekday: weekdayNum + 1,
    hour: 9,
    minute: 0,
    repeats: true,
  };

  const reminderId = await Notifications.scheduleNotificationAsync({
    content: {
      title: `🔧 Weekly Vehicle Check`,
      body: `Inspect your ${brand} ${model} (${plate}) today.`,
      data: { type: "weeklyInspection", vehicleId },
    },
    trigger,
  });

  await updateDoc(doc(db, "vehicles", vehicleId), {
    weeklyReminderMeta: {
      reminderId,
      weekday,
      createdAt: new Date().toISOString(),
    },
  });

  console.log(`📅 Weekly reminder set for ${weekday} (ID: ${reminderId})`);
};
