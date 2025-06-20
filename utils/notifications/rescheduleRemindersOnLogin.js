import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { scheduleReminder } from "./scheduleReminder";
import { scheduleWeeklyReminder } from "./scheduleWeeklyReminder";

/**
 * Reschedule all pending maintenance reminders for the logged-in user on app launch/login.
 * @param {string} userEmail
 */
export const rescheduleRemindersOnLogin = async (userEmail) => {
  try {
    const q = query(
      collection(db, "maintenanceRecords"),
      where("userEmail", "==", userEmail)
    );
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      if (data.statusDone || !data.nextServiceDate || !data.reminders) continue;

      // Skip if reminders already have reminderId (already scheduled)
      const alreadyScheduled = Array.isArray(data.reminders)
        ? data.reminders.every((r) => r.reminderId)
        : false;
      if (alreadyScheduled) continue;

      const nextService = new Date(data.nextServiceDate);
      for (const { option, reminderId } of data.reminders) {
        if (reminderId) continue; // Skip if already scheduled
        await scheduleReminder(nextService, option, {
          id: docSnap.id,
          plate: data.plate,
          brand: data.brand,
          model: data.model,
        });
      }
    }

    console.log("✅ Rescheduled all pending reminders.");
  } catch (error) {
    console.error("❌ Failed to reschedule reminders:", error);
  }
};

/**
 * Reschedule all weekly inspection reminders for the logged-in user on app launch/login.
 * @param {string} userId
 */
export const rescheduleWeeklyRemindersOnLogin = async (userId) => {
  try {
    const snapshot = await getDocs(
      query(collection(db, "vehicles"), where("userId", "==", userId))
    );

    for (const docSnap of snapshot.docs) {
      const vehicle = docSnap.data();
      const vehicleId = docSnap.id;

      // Skip if weekly reminder already scheduled
      if (
        vehicle.inspectionReminderEnabled &&
        vehicle.weeklyInspectionDay &&
        !(vehicle.weeklyReminderMeta && vehicle.weeklyReminderMeta.reminderId)
      ) {
        await scheduleWeeklyReminder(
          vehicle.weeklyInspectionDay,
          vehicle.plate,
          vehicle.brand,
          vehicle.model,
          vehicleId
        );
      }
    }

    console.log("🔁 Rescheduled all weekly reminders on login.");
  } catch (error) {
    console.error("❌ Failed to reschedule weekly reminders:", error);
  }
};
