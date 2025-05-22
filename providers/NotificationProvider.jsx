import React, { useEffect, useRef, useState } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Alert, Platform } from "react-native";
import { auth, db } from "../config/FirebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { collection, getDocs, query, where } from "firebase/firestore";
import { scheduleLocalReminder } from "../utils/scheduleReminder";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function NotificationProvider({ children }) {
  const [expoPushToken, setExpoPushToken] = useState("");
  const notificationListener = useRef();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setExpoPushToken(token ?? ""))
      .catch((error) => setExpoPushToken(`${error}`));

    notificationListener.current =
      Notifications.addNotificationReceivedListener((notification) => {
        Alert.alert(
          notification.request.content.title || "Notification",
          notification.request.content.subtitle || "Subtitle"
        );
      });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(
          notificationListener.current
        );
      }
    };
  }, []);

  useEffect(() => {
    saveUserPushToken();
  }, [expoPushToken]);

  const saveUserPushToken = async () => {
    const user = auth.currentUser;
    if (!user?.uid || !expoPushToken) return;

    try {
      await setDoc(
        doc(db, "notificationTokens", user.uid),
        {
          uid: user.uid,
          token: expoPushToken,
          email: user.email,
          timestamp: new Date().toISOString(),
        },
        { merge: true }
      );
      console.log("Push token saved to Firestore");
    } catch (error) {
      console.error("Failed to save token:", error);
    }
  };

  return children;
}

function handleRegistrationError(errorMessage) {
  alert(errorMessage);
  throw new Error(errorMessage);
}

async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permission not granted to get push token for notifications."
      );
      return;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError("Expo project ID not found.");
    }

    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log("Expo Push Token:", pushTokenString);
      return pushTokenString;
    } catch (e) {
      handleRegistrationError(`${e}`);
    }
  } else {
    alert("Must use a physical device for push notifications.");
  }
}

const scheduleAllReminders = async (userId) => {
  const snapshot = await getDocs(
    query(collection(db, "vehicles"), where("userId", "==", userId))
  );

  snapshot.forEach((doc) => {
    const vehicle = doc.data();
    const { brand, model } = vehicle;

    // Schedule part reminders
    vehicle.parts?.forEach((part) => {
      if (
        part.reminderEnabled &&
        part.reminderSent === false &&
        part.nextServiceDate
      ) {
        const targetDate = new Date(part.nextServiceDate);
        const today = new Date();

        if (targetDate > today) {
          scheduleLocalReminder(
            targetDate,
            `Service Reminder: ${part.name}`,
            `Your ${brand} ${model} needs a ${part.name} service.`
          );
        }
      }
    });

    // Schedule weekly inspection reminders
    const today = new Date();
    const weekday = today.toLocaleDateString("en-US", { weekday: "long" });

    if (
      vehicle.inspectionReminderEnabled &&
      vehicle.weeklyInspectionDay === weekday
    ) {
      scheduleLocalReminder(
        new Date(today.setHours(9, 0, 0)), // e.g., every Monday at 9am
        `Weekly Inspection Reminder`,
        `Please check your ${brand} ${model} as part of your weekly inspection.`
      );
    }
  });
};
