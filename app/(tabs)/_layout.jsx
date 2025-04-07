import { View, Text, LogBox } from "react-native";
import { Tabs, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { auth } from "../../config/FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { getLocalStorage } from "../../service/Storage";

export default function TabLayout() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    GetUserDetail();
  }, []);

  const GetUserDetail = async () => {
    const userInfo = await getLocalStorage("userDetail");
    if (!userInfo) {
      router.replace("/(auth)/login");
    }
  };

  return (
    <Tabs>
      <Tabs.Screen name="index" />
    </Tabs>
  );
}
