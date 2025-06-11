import { doc, updateDoc } from "firebase/firestore";
import { scheduleReminder } from "./scheduleReminder"; // Adjust path as needed
import { db } from "../../config/FirebaseConfig";

/**
 * Automatically schedule 1d, 3d, and 7d reminders before next service date.
 * @param {string | Date} nextServiceDate - Full next service date
 * @param {string} recordId - Firestore ID of the maintenance record
 * @param {string} plate - Vehicle plate number
 */
export const autoScheduleAllReminders = async (
  nextServiceDate,
  recordId,
  plate,
  brand,
  model
) => {
  const selectedOptions = ["1d", "3d", "7d"];
  const reminders = [];

  const navigationData = {
    id: recordId,
    plate,
    brand,
    model,
  };

  for (const option of selectedOptions) {
    const reminder = await scheduleReminder(
      nextServiceDate,
      option,
      navigationData
    );
    if (reminder) reminders.push({ ...reminder, option, sent: false });
  }

  if (reminders.length > 0) {
    await updateDoc(doc(db, "maintenanceRecords", recordId), {
      reminders,
    });
  }
};
