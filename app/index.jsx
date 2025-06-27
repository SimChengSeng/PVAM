// app/index.js
import { Redirect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export default function Index() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    const checkFirstLaunch = async () => {
      const seen = await AsyncStorage.getItem("hasSeenWelcome");
      if (seen === "true") {
        setInitialRoute("/(tabs)/1_index");
      } else {
        setInitialRoute("/(auth)/welcome");
      }
    };
    checkFirstLaunch();
  }, []);

  if (!initialRoute) return null; // optional: show splash/loading indicator

  return <Redirect href={initialRoute} />;
}
