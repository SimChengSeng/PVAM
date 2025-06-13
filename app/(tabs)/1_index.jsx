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
import {
  Avatar,
  Text,
  Card,
  Button,
  Dialog,
  Portal,
  RadioButton,
} from "react-native-paper";
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
import PlateSearch from "../directlyNotify/components/plateSearch";
import VehicleCategoryIcon from "../vehicleManage/components/VehicleCategoryIcon";

export default function Index() {
  const router = useRouter();
  const navigation = useNavigation(); // <-- Add this line
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (userEmail) {
      GetVehicleList();
      setRefreshing(true);
    } else {
      setRefreshing(false);
    }
  }, [userEmail]);

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

  // const formatDate = (dateStr) => {
  //   if (!dateStr) return "N/A";
  //   const date = new Date(dateStr);
  //   return new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(
  //     date
  //   );
  // };

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

  const GetVehicleList = useCallback(async () => {
    if (!userEmail) return;
    try {
      const q = query(
        collection(db, "vehicles"),
        where("userEmail", "==", userEmail)
      );
      const querySnapshot = await getDocs(q);
      const list = [];
      querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));

      // Attach upcoming maintenance to default vehicle
      const defaultVehicle = list.find((v) => v.isDefault);
      if (defaultVehicle) {
        const q2 = query(
          collection(db, "maintenanceRecords"),
          where("vehicleId", "==", defaultVehicle.id),
          where("statusDone", "==", false)
        );
        const nextMaintenanceSnapshot = await getDocs(q2);
        const upcoming = nextMaintenanceSnapshot.docs
          .map((doc) => doc.data())
          .sort((a, b) => (a.nextServiceDate > b.nextServiceDate ? 1 : -1));

        if (upcoming.length > 0) {
          const next = upcoming[0];
          defaultVehicle.nextServiceDateFormatted =
            next.nextServiceDate && next.nextServiceDate !== "N/A"
              ? next.nextServiceDate
              : next.estimateNextServiceDate
              ? `Est. +${next.estimateNextServiceDate} months`
              : "N/A";
          defaultVehicle.nextServiceType = next.type || "Maintenance";
          defaultVehicle.nextServiceMileage = next.nextServiceMileage || null; // <-- Add this line
        }
      }

      setVehicles(list);
    } catch (e) {
      console.log("Error fetching vehicles:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userEmail]);

  if (loading) {
    return (
      <View style={[globalStyles.container, { justifyContent: "center" }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

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

  // const getRemainingTime = (dateStr) => {
  //   if (!dateStr) return "Date not set";

  //   const today = new Date();
  //   const nextDate = new Date(dateStr);
  //   const diffTime = nextDate - today;

  //   if (diffTime <= 0) return "Past due";

  //   const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  //   const diffMonths = Math.floor(diffDays / 30);

  //   if (diffMonths >= 1) {
  //     const remainingDays = diffDays % 30;
  //     return `${diffMonths} month${diffMonths > 1 ? "s" : ""}${
  //       remainingDays
  //         ? ` ${remainingDays} day${remainingDays > 1 ? "s" : ""}`
  //         : ""
  //     } left`;
  //   }

  //   return `${diffDays} day${diffDays > 1 ? "s" : ""} left`;
  // };

  // Add this function to handle setting the default vehicle
  const handleSetDefaultVehicle = async () => {
    try {
      const updated = vehicles.map(async (v) => {
        await updateDoc(doc(db, "vehicles", v.id), {
          isDefault: v.id === selectedVehicleId,
        });
      });
      await Promise.all(updated);
      Alert.alert("Success", "Default vehicle updated.");
      GetVehicleList();
      setShowDialog(false);
    } catch (error) {
      Alert.alert("Error", "Failed to update default vehicle.");
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
                <Card
                  style={[
                    globalStyles.card,
                    { marginBottom: 16, borderRadius: 16 },
                  ]}
                >
                  <Card.Title
                    title="Default Vehicle"
                    subtitle="Primary vehicle details"
                    titleStyle={{
                      color: "#1e293b",
                      fontWeight: "bold",
                      fontSize: 18,
                    }}
                    subtitleStyle={{
                      color: "#64748b",
                      fontSize: 13,
                    }}
                    right={() => (
                      <View
                        style={{
                          width: 64,
                          height: 64,
                          justifyContent: "center",
                          alignItems: "center",
                          right: 50,
                        }}
                      >
                        <VehicleCategoryIcon
                          category={
                            vehicles.find((v) => v.isDefault).vehicleCategory
                          }
                          color={vehicles.find((v) => v.isDefault).color}
                        />
                      </View>
                    )}
                  />

                  <Card.Content>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "bold",
                        color: "#1e293b",
                        marginBottom: 6,
                      }}
                    >
                      {vehicles.find((v) => v.isDefault).plate} •{" "}
                      {vehicles.find((v) => v.isDefault).brand}{" "}
                      {vehicles.find((v) => v.isDefault).model}
                    </Text>

                    <View style={{ marginTop: 6, gap: 6 }}>
                      <InfoRow
                        icon="calendar-outline"
                        label="Year"
                        value={vehicles.find((v) => v.isDefault).year}
                      />
                      <InfoRow
                        icon="speedometer-outline"
                        label="Mileage"
                        value={`${
                          vehicles.find((v) => v.isDefault).Mileage ?? 0
                        } km`}
                      />
                    </View>

                    {/* Upcoming Maintenance Info */}
                    {vehicles.find((v) => v.isDefault)
                      ?.nextServiceDateFormatted && (
                      <View style={{ marginTop: 10 }}>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#ff0000",
                            fontWeight: "bold",
                          }}
                        >
                          Upcoming Maintenance:
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#ca8a04",
                            fontWeight: "bold",
                          }}
                        >
                          {(() => {
                            const type =
                              vehicles.find((v) => v.isDefault)
                                ?.nextServiceType ?? "Maintenance";
                            const shortType =
                              type.length > 40
                                ? type.slice(0, 40) + "..."
                                : type;
                            return shortType;
                          })()}
                        </Text>
                        <Text style={{ fontSize: 14, color: "#ca8a04" }}>
                          Next Service:{" "}
                          {
                            vehicles.find((v) => v.isDefault)
                              .nextServiceDateFormatted
                          }
                        </Text>
                        {vehicles.find((v) => v.isDefault)
                          ?.nextServiceMileage && (
                          <Text style={{ fontSize: 14, color: "#ca8a04" }}>
                            Next Service Mileage:{" "}
                            {
                              vehicles.find((v) => v.isDefault)
                                .nextServiceMileage
                            }{" "}
                            km
                          </Text>
                        )}
                      </View>
                    )}
                  </Card.Content>
                </Card>
              </Pressable>
            ) : (
              <Pressable onPress={() => setShowDialog(true)}>
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
                label="Inbox"
                color="#16a34a"
                bgColor="#dcfce7"
                onPress={() =>
                  router.push("/directlyNotify/DirectlyNotifyProfileScreen")
                }
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

            {/* 4. Plate Search */}
            <Text style={styles.sectionTitle}>Direct Notifications</Text>
            <PlateSearch />
            <Pressable
              onPress={() =>
                router.push("/directlyNotify/DirectlyNotifyInboxScreen")
              }
            >
              <Text style={{ color: "#3b82f6", fontWeight: "bold" }}>
                View my Notifications →
              </Text>
            </Pressable>

            {/* 5. Other Vehicles */}
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
                    <Text style={globalStyles.textDetail}>
                      Vehicle Type: {v.vehicleType}
                    </Text>
                  </Card>
                </Pressable>
              ))}
            {vehicles.filter((v) => !v.isDefault).length > 5 && (
              <Pressable
                onPress={() => {
                  console.log("Pressed View All Vehicles");
                  router.push("2_VehicleManagementScreen");
                }}
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

      {/* Dialog for selecting default vehicle */}
      <Portal>
        <Dialog visible={showDialog} onDismiss={() => setShowDialog(false)}>
          <Dialog.Title>Select Default Vehicle</Dialog.Title>
          <Dialog.Content>
            <RadioButton.Group
              onValueChange={setSelectedVehicleId}
              value={selectedVehicleId}
            >
              {vehicles.map((v) => (
                <RadioButton.Item
                  key={v.id}
                  label={`${v.plate} - ${v.brand} ${v.model}`}
                  value={v.id}
                />
              ))}
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDialog(false)}>Cancel</Button>
            <Button
              onPress={handleSetDefaultVehicle}
              disabled={!selectedVehicleId}
            >
              Set Default
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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

const InfoRow = ({ icon, label, value }) => (
  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      marginBottom: 4,
    }}
  >
    <Ionicons
      name={icon}
      size={18}
      color="#64748b"
      style={{ width: 24, marginRight: 8 }}
    />
    <Text style={{ fontSize: 14, color: "#64748b", width: 90 }}>{label}:</Text>
    <Text
      style={{
        fontSize: 14,
        fontWeight: "500",
        color: "#1e293b",
        flexShrink: 1,
      }}
    >
      {value}
    </Text>
  </View>
);

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
