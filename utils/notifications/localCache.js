// Save and retrieve notifications for offline access
import AsyncStorage from "@react-native-async-storage/async-storage";

export const saveNotificationsToCache = async (notifications) => {
  try {
    await AsyncStorage.setItem(
      "appNotifications",
      JSON.stringify(notifications)
    );
  } catch (e) {
    console.error("Cache error", e);
  }
};

export const getCachedNotifications = async () => {
  try {
    const data = await AsyncStorage.getItem("appNotifications");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};
