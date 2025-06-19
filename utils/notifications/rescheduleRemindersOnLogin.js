import { getDocs, collection, query, where } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { scheduleReminder } from "./scheduleReminder";

/**
 * Reschedule all pending reminders for the logged-in user on app launch/login.
 * @param {string} userEmail
 */
export const rescheduleRemindersOnLogin = async (userEmail) => {
  try {
    const q = query(collection(db, "maintenanceRecords"), where("userEmail", "==", userEmail));
    const snapshot = await getDocs(q);

    for (const docSnap of snapshot.docs) {
      const record = docSnap.data();
      const id = docSnap.id;

      if (!record.reminders || record.statusDone) continue;

      const validReminders = record.reminders.filter((r) => !r.sent);
      const { plate, brand, model } = record;

      for (const r of validReminders) {
        const reminderDate = new Date(r.scheduledFor);
        const now = new Date();
        if (reminderDate > now) {
          await scheduleReminder(reminderDate, r.option, {
            id,
            plate,
            brand,
            model,
          });
        }
      }
    }

    console.log("✅ Rescheduled all pending reminders.");
  } catch (error) {
    console.error("❌ Failed to reschedule reminders:", error);
  }
};
