import * as Notifications from "expo-notifications";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";

/**
 * Schedule a weekly local notification reminder and store it in Firestore.
 * @param {string} weekday - "Monday" to "Sunday"
 * @param {string} plate - Vehicle plate number
 * @param {string} brand - Vehicle brand
 * @param {string} model - Vehicle model
 * @param {string} vehicleId - Firestore vehicle document ID
 */
export const scheduleWeeklyReminder = async (
  weekday,
  plate,
  brand,
  model,
  vehicleId
) => {
  const weekdayMap = {
    Sunday: 1, // ✅ Sunday = 1 in Expo
    Monday: 2,
    Tuesday: 3,
    Wednesday: 4,
    Thursday: 5,
    Friday: 6,
    Saturday: 7,
  };

  const weekdayNumber = weekdayMap[weekday];
  if (!weekdayNumber) {
    console.warn("❌ Invalid weekday:", weekday);
    return;
  }

  const reminderId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "🔧 Weekly Vehicle Check",
      body: `Please inspect your ${brand} ${model} (${plate}) today.`,
      data: {
        type: "weeklyInspection",
        screen: "VehicleDetailScreen",
        vehicleId,
        plate,
        brand,
        model,
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      weekday: weekdayNumber,
      hour: 11,
      minute: 0,
      repeats: true,
    },
  });

  // Save reminder metadata
  await updateDoc(doc(db, "vehicles", vehicleId), {
    weeklyReminderMeta: {
      reminderId,
      weekday,
      createdAt: new Date().toISOString(),
    },
  });

  console.log(
    `📅 Weekly reminder set for ${weekday} at 09:00 (ID: ${reminderId})`
  );
};
