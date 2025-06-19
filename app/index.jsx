// app/index.jsx
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { auth } from "../config/FirebaseConfig";
import { rescheduleRemindersOnLogin } from "../utils/notifications/rescheduleRemindersOnLogin";

export default function Index() {
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        rescheduleRemindersOnLogin(user.email);
      }
    });
    return () => unsubscribe();
  }, []);

  return <Redirect href="/(tabs)/1_index" />;
}
