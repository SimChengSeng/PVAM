import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import NotificationProvider from "../../providers/NotificationProvider";
import { getLocalStorage } from "../../service/Storage";

export default function TabLayout() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const user = await getLocalStorage("userDetail");
      if (!user) {
        router.replace("/(auth)/LoginScreen");
      } else {
        setLoading(false);
      }
    };
    checkUser();

    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        if (data?.screen === "VehicleDetailScreen") {
          router.push({
            pathname: "/vehicleManage/VehicleDetailScreen",
            params: data.vehicle,
          });
        }
      }
    );
    return () => sub.remove();
  }, []);

  if (loading) return null;

  return (
    <NotificationProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#7c3aed",
          tabBarInactiveTintColor: "#a1a1aa",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 0.5,
            borderTopColor: "#e5e7eb",
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "bold",
          },
        }}
      >
        <Tabs.Screen
          name="1_index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="2_VehicleManagementScreen"
          options={{
            title: "Vehicles",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "car" : "car-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="3_MaintenanceScreen"
          options={{
            title: "Maintenance",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "construct" : "construct-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="4_ProfileScreen"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size, focused }) => (
              <Ionicons
                name={focused ? "person" : "person-outline"}
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </NotificationProvider>
  );
}
