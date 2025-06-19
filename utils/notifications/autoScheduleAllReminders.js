import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { scheduleReminder } from "./scheduleReminder";

export const autoScheduleAllReminders = async (
  nextServiceDate,
  recordId,
  plate,
  brand,
  model
) => {
  const reminders = [];
  const reminderOptions = ["1d", "3d", "7d"];
  const metadata = { id: recordId, plate, brand, model };

  for (const option of reminderOptions) {
    const reminder = await scheduleReminder(nextServiceDate, option, metadata);
    if (reminder) reminders.push({ ...reminder, option, sent: false });
  }

  if (reminders.length > 0) {
    await updateDoc(doc(db, "maintenanceRecords", recordId), { reminders });
  }
};
/**
 * Automatically schedules reminders for all options (1d, 3d, 7d) before the next service date.
 * Updates the maintenance record with the scheduled reminders.
 *
 * @param {Date|string} nextServiceDate - The date of the next service.
 * @param {string} recordId - The ID of the maintenance record.
 * @param {string} plate - The vehicle's license plate.
 * @param {string} brand - The vehicle's brand.
 * @param {string} model - The vehicle's model.
 */
