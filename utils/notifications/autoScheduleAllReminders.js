import { scheduleReminder } from "./scheduleReminder";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";

/**
 * Automatically schedule 1d, 3d, and 7d reminders before next service date.
 * Stores reminder info in Firestore under the maintenance record.
 */
export const autoScheduleAllReminders = async (
  nextServiceDate,
  recordId,
  plate,
  brand,
  model
) => {
  const options = ["1d", "3d", "7d"];
  const reminders = [];

  for (const option of options) {
    const reminder = await scheduleReminder(nextServiceDate, option, {
      id: recordId,
      plate,
      brand,
      model,
    });
    if (reminder) reminders.push({ ...reminder, option, sent: false });
  }

  if (reminders.length > 0) {
    await updateDoc(doc(db, "maintenanceRecords", recordId), {
      reminders,
    });
  }
};
