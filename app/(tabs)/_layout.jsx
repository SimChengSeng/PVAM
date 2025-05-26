import React, { useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons"; // Icon library
import HomeScreen from "./index"; // Home screen
import VehicleManagementScreen from "./VehicleManagementScreen"; // Vehicles screen
import MaintenanceScreen from "./MaintenanceScreen"; // Maintenance screen
import ProfileScreen from "./ProfileScreen"; // Profile screen
import { useRouter } from "expo-router";
import { getLocalStorage } from "../../service/Storage"; // Local storage utility
import NotificationProvider from "../../providers/NotificationProvider"; // Notification provider

const Tab = createBottomTabNavigator();

const TabLayout = () => {
  const router = useRouter();

  useEffect(() => {
    const GetUserDetail = async () => {
      const userInfo = await getLocalStorage("userDetail");
      if (!userInfo) {
        router.replace("/auth/LoginScreen");
      }
    };

    GetUserDetail();
  }, []);

  return (
    <NotificationProvider>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            // Assign icons based on route name
            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Vehicles") {
              iconName = focused ? "car" : "car-outline";
            } else if (route.name === "Maintenance") {
              iconName = focused ? "construct" : "construct-outline";
            } else if (route.name === "Profile") {
              iconName = focused ? "person" : "person-outline";
            }

            // Return the icon component
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: "#007aff", // Active tab color
          tabBarInactiveTintColor: "gray", // Inactive tab color
          headerShown: false, // Disable header for tab screens
        })}
      >
        {/* Define tabs with their associated screens */}
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Vehicles" component={VehicleManagementScreen} />
        <Tab.Screen name="Maintenance" component={MaintenanceScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NotificationProvider>
  );
};

export default TabLayout;
