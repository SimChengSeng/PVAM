// utils/logAppNotification.js
import { db } from "../../config/FirebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const logAppNotification = async ({
  userId,
  type = "success",
  title,
  message,
}) => {
  try {
    await addDoc(collection(db, "appNotifications"), {
      userId,
      type,
      title,
      message,
      read: false,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    console.error("Failed to log notification:", e);
  }
};
