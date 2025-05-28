import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  BackHandler, // Import BackHandler
  Alert, // Import Alert for confirmation dialog
  Animated,
} from "react-native";
import { Avatar, Text, Card, Button } from "react-native-paper";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getLocalStorage } from "../../service/Storage";
import { db } from "../../config/FirebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { globalStyles } from "../../styles/globalStyles";
import { useNavigation } from "@react-navigation/native";

export default function Index() {
  const router = useRouter();
  const navigation = useNavigation(); // <-- Add this line
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  const greeting = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      const user = await getLocalStorage("userDetail");
      if (user?.displayName) {
        setUserName(user.displayName);
      }
      if (user?.email) {
        setUserEmail(user.email);
      } else {
        console.error("User email is not available in local storage.");
      }
    };
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        // Show a confirmation dialog before exiting
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Exit", onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true }
        );
        return true; // Prevent default back navigation
      };

      // Add the back handler
      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      // Cleanup the back handler when the screen is unfocused
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [userEmail]) // Add userEmail as a dependency
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (userEmail) {
        GetVehicleList();
      }
    });

    return unsubscribe; // cleanup on unmount
  }, [navigation, userEmail]);

  useEffect(() => {
    if (userEmail) {
      GetVehicleList();
    }
  }, [userEmail]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    GetVehicleList();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(
      date
    );
  };

  // const renderVehicle = ({ item }) => (
  //   <Pressable
  //     onPress={() =>
  //       router.push({
  //         pathname: "vehicleManage/VehicleDetailScreen",
  //         params: item,
  //       })
  //     }
  //   >
  //     <View style={globalStyles.card}>
  //       <Text style={globalStyles.vehicleName}>
  //         {item.plate} - {item.brand} {item.model}
  //       </Text>
  //       <Text style={globalStyles.textDetail}>
  //         Vehicle Color: {item.color ?? "N/A"}
  //       </Text>
  //       <Text style={globalStyles.textDetail}>Year: {item.year}</Text>
  //     </View>
  //   </Pressable>
  // );

  const GetVehicleList = async () => {
    if (!userEmail) {
      console.error("User email is undefined. Cannot fetch vehicles.");
      return;
    }

    try {
      const q = query(
        collection(db, "vehicles"),
        where("userEmail", "==", userEmail)
      );

      const querySnapshot = await getDocs(q);
      const vehicleList = [];

      querySnapshot.forEach((doc) => {
        vehicleList.push({ id: doc.id, ...doc.data() });
      });

      setVehicles(vehicleList);
    } catch (e) {
      console.log("Error fetching vehicles:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  // Add this block after the loading check
  if (!userEmail) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ textAlign: "center", marginTop: 12 }}>
          Loading user details...
        </Text>
      </View>
    );
  }

  const getRemainingTime = (dateStr) => {
    if (!dateStr) return "Date not set";

    const today = new Date();
    const nextDate = new Date(dateStr);
    const diffTime = nextDate - today;

    if (diffTime <= 0) return "Past due";

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths >= 1) {
      const remainingDays = diffDays % 30;
      return `${diffMonths} month${diffMonths > 1 ? "s" : ""}${
        remainingDays
          ? ` ${remainingDays} day${remainingDays > 1 ? "s" : ""}`
          : ""
      } left`;
    }

    return `${diffDays} day${diffDays > 1 ? "s" : ""} left`;
  };

  const selectDefaultVehicle = async (userEmail, setVehicles, setLoading) => {
    try {
      setLoading(true);

      // Fetch all vehicles for the user
      const q = query(
        collection(db, "vehicles"),
        where("userEmail", "==", userEmail)
      );
      const querySnapshot = await getDocs(q);

      const vehicleList = [];
      querySnapshot.forEach((doc) => {
        vehicleList.push({ id: doc.id, ...doc.data() });
      });

      // Show a selection dialog
      Alert.alert(
        "Select Default Vehicle",
        "Choose a vehicle to set as your default:",
        vehicleList.map((vehicle) => ({
          text: `${vehicle.plate} - ${vehicle.brand} ${vehicle.model}`,
          onPress: async () => {
            // Update the selected vehicle as default
            await updateDoc(doc(db, "vehicles", vehicle.id), {
              isDefault: true,
            });

            // Remove `isDefault` from other vehicles
            const otherVehicles = vehicleList.filter(
              (v) => v.id !== vehicle.id
            );
            for (const otherVehicle of otherVehicles) {
              await updateDoc(doc(db, "vehicles", otherVehicle.id), {
                isDefault: false,
              });
            }

            // Refresh the vehicle list
            setVehicles(
              vehicleList.map((v) => ({ ...v, isDefault: v.id === vehicle.id }))
            );
            Alert.alert(
              "Success",
              `${vehicle.plate} is now your default vehicle.`
            );
          },
        })),
        { cancelable: true }
      );
    } catch (error) {
      console.error("Error selecting default vehicle:", error);
      Alert.alert(
        "Error",
        "Failed to set the default vehicle. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        // renderItem={renderVehicle}
        style={globalStyles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 60,
          paddingBottom: 120,
        }}
        ListHeaderComponent={
          <>
            {/* 1. Greeting */}
            <Text style={styles.greeting}>
              {greeting}, {userName}!
            </Text>

            {/* 2. Default Vehicle */}
            {vehicles.find((v) => v.isDefault) ? (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "vehicleManage/VehicleDetailScreen",
                    params: vehicles.find((v) => v.isDefault),
                  })
                }
              >
                <Card style={globalStyles.card}>
                  <Card.Title
                    title="Default Vehicle"
                    subtitle="My primary vehicle"
                    titleStyle={{ color: "#333", fontWeight: "bold" }}
                    subtitleStyle={{ color: "#333" }}
                    left={() => (
                      <Avatar.Icon
                        icon="car"
                        size={48}
                        style={{ backgroundColor: "#3b82f6" }}
                      />
                    )}
                  />
                  <Card.Content>
                    <Text style={globalStyles.vehicleName}>
                      {vehicles.find((v) => v.isDefault).plate} -{" "}
                      {vehicles.find((v) => v.isDefault).brand}{" "}
                      {vehicles.find((v) => v.isDefault).model}
                    </Text>
                  </Card.Content>
                </Card>
              </Pressable>
            ) : (
              <Pressable
                onPress={() =>
                  selectDefaultVehicle(userEmail, setVehicles, setLoading)
                }
              >
                <Card style={globalStyles.card}>
                  <Card.Title
                    title="No Default Vehicle"
                    subtitle="Tap to select one"
                    titleStyle={{ color: "#333", fontWeight: "bold" }}
                    subtitleStyle={{ color: "#333" }}
                    left={() => (
                      <Avatar.Icon
                        icon="alert-circle"
                        size={48}
                        style={{ backgroundColor: "#f87171" }}
                      />
                    )}
                  />
                  <Card.Content>
                    <Text style={globalStyles.textDetail}>
                      You currently have no default vehicle selected.
                    </Text>
                    <Text style={globalStyles.textDetail}>
                      Tap here to add or select a default vehicle.
                    </Text>
                  </Card.Content>
                </Card>
              </Pressable>
            )}

            {/* 3. Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <QuickActionCard
                icon="car-outline"
                label="Add Vehicle"
                color="#0284c7"
                bgColor="#e0f2fe"
                onPress={() => router.push("/vehicleManage/add-new-vehicle")}
              />
              <QuickActionCard
                icon="construct-outline"
                label="Add Maintenance"
                color="#dc2626"
                bgColor="#ffe4e6"
                onPress={() => router.push("/maintenance/add")}
              />
              <QuickActionCard
                icon="person-outline"
                label="Profile"
                color="#16a34a"
                bgColor="#dcfce7"
                onPress={() => router.push("/profile")}
              />
              <QuickActionCard
                icon="notifications-outline"
                label="Reminders"
                color="#ca8a04"
                bgColor="#fef3c7"
                onPress={() =>
                  Alert.alert("Reminder", "This is a quick reminder!")
                }
              />
            </View>

            {/* 4. Other Vehicles */}
            <Text style={styles.sectionTitle}>My Vehicles</Text>
            {vehicles
              .filter((v) => !v.isDefault)
              .slice(0, 5)
              .map((v) => (
                <Pressable
                  key={v.id}
                  onPress={() =>
                    router.push({
                      pathname: "vehicleManage/VehicleDetailScreen",
                      params: v,
                    })
                  }
                >
                  <Card style={[globalStyles.card]}>
                    <Text style={globalStyles.vehicleName}>
                      {v.plate} - {v.brand} {v.model}
                    </Text>
                    <Text style={globalStyles.textDetail}>
                      Vehicle Color: {v.color ?? "N/A"}
                    </Text>
                    <Text style={globalStyles.textDetail}>Year: {v.year}</Text>
                  </Card>
                </Pressable>
              ))}
            {vehicles.filter((v) => !v.isDefault).length > 5 && (
              <Pressable
                onPress={() => router.push("/vehicleManage/vehicleList")}
              >
                <Text
                  style={{ color: "#3b82f6", marginTop: 8, fontWeight: "bold" }}
                >
                  View All Vehicles →
                </Text>
              </Pressable>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={globalStyles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#777" />
            <Text style={globalStyles.emptyTitle}>No vehicles added yet</Text>
            <Text style={globalStyles.emptyMessage}>
              Tap the button below to add your first vehicle
            </Text>
          </View>
        }
      />

      <Pressable
        style={globalStyles.addButton}
        onPress={() => router.push("/vehicleManage/add-new-vehicle")}
      >
        <Ionicons name="add-circle" size={28} color="#fff" />
        <Text style={globalStyles.addText}>Add Vehicle</Text>
      </Pressable>
    </>
  );
}

const QuickActionCard = ({ icon, label, color, bgColor, onPress }) => {
  const scale = new Animated.Value(1);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={{ width: "48%", marginBottom: 12 }}
    >
      <Animated.View
        style={[
          styles.quickActionCard,
          { backgroundColor: bgColor },
          { transform: [{ scale }] },
        ]}
      >
        <Ionicons name={icon} size={32} color={color} />
        <Text style={styles.quickActionText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333", // Darker text for light theme
  },
  subText: {
    marginTop: 4,
    color: "#666", // Medium gray for light theme
    marginBottom: 12,
  },
  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    marginTop: 16,
  },

  quickActionCard: {
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    paddingVertical: 12,
    alignItems: "center",
  },
  quickActionText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  maintenanceCard: {
    backgroundColor: "#ffffff", // White background for light theme
    borderRadius: 16,
    marginTop: 20,
    width: "100%",
    alignSelf: "center",
    paddingBottom: 12,
    elevation: 4, // Add shadow for better visibility
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  maintenanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd", // Light gray for borders
  },
});
