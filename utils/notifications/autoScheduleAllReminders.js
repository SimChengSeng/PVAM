import { scheduleReminder } from "./scheduleReminder";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";

/**
 * Schedule 1d, 3d, 7d reminders for upcoming maintenance.
 */
export const autoScheduleAllReminders = async (
  nextServiceDate,
  recordId,
  plate,
  brand,
  model
) => {
  const reminderOptions = ["1d", "3d", "7d"];
  const reminders = [];

  for (const option of reminderOptions) {
    const reminder = await scheduleReminder(nextServiceDate, option, {
      id: recordId,
      plate,
      brand,
      model,
    });
    if (reminder) reminders.push({ ...reminder, option, sent: false });
  }

  if (reminders.length > 0) {
    await updateDoc(doc(db, "maintenanceRecords", recordId), { reminders });
  }
};
