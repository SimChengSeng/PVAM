import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  BackHandler,
  Alert,
  Animated,
  Image,
} from "react-native";
import {
  Avatar,
  Text,
  Card,
  Button,
  Dialog,
  Portal,
  RadioButton,
  useTheme,
  IconButton,
} from "react-native-paper";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { getLocalStorage } from "../../service/Storage";
import { db, auth } from "../../config/FirebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { globalStyles, getThemedStyles } from "../../styles/globalStyles";
import { useNavigation } from "@react-navigation/native";
import PlateSearch from "../directlyNotify/components/plateSearch";
import VehicleCategoryIcon from "../vehicleManage/components/VehicleCategoryIcon";

export default function Index() {
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const themed = getThemedStyles(theme);
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [unreadApp, setUnreadApp] = useState(0);
  const [unreadDirect, setUnreadDirect] = useState(0);

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
        Alert.alert(
          "Exit App",
          "Are you sure you want to exit?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Exit", onPress: () => BackHandler.exitApp() },
          ],
          { cancelable: true }
        );
        return true;
      };
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [userEmail])
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
    return unsubscribe;
  }, [navigation, userEmail]);

  useEffect(() => {
    if (userEmail) {
      GetVehicleList();
    }
  }, [userEmail]);

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
          defaultVehicle.nextServiceMileage = next.nextServiceMileage || null;
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

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // App notifications
    const unsubApp = onSnapshot(
      query(
        collection(db, "appNotifications"),
        where("userId", "==", userId),
        where("read", "==", false)
      ),
      (snap) => setUnreadApp(snap.size)
    );

    // Direct messages
    const unsubDirect = onSnapshot(
      query(
        collection(db, "vehicleMessages"),
        where("participants", "array-contains", userId)
      ),
      (snap) => {
        let count = 0;
        snap.forEach((doc) => {
          const data = doc.data();
          if (!data.readStatus?.[userId]) count += 1;
        });
        setUnreadDirect(count);
      }
    );

    return () => {
      unsubApp();
      unsubDirect();
    };
  }, []);

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
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.topBar, { backgroundColor: theme.colors.primary }]}>
        <Image
          source={require("../../assets/images/logo-light-transparent.png")}
          style={{ height: 36, width: 140, resizeMode: "contain" }}
        />
        <Pressable
          onPress={() =>
            router.push("/notificationsManage/NotificationInboxScreen")
          }
          style={{ marginRight: 4, padding: 4 }}
          android_ripple={{ color: "#ddd", borderless: true }}
        >
          <View>
            <Ionicons
              name="notifications-outline"
              size={26}
              color={theme.colors.onPrimary}
            />
            {unreadApp + unreadDirect > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  backgroundColor: "#dc2626",
                  borderRadius: 8,
                  width: 14,
                  height: 14,
                  justifyContent: "center",
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: theme.colors.primary,
                }}
              >
                <Text
                  style={{ color: "#fff", fontSize: 10, fontWeight: "bold" }}
                >
                  {unreadApp + unreadDirect > 9
                    ? "9+"
                    : unreadApp + unreadDirect}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
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
          paddingTop: 16,
          paddingBottom: 120,
          ...themed.containerBg,
        }}
        ListHeaderComponent={
          <>
            {/* 1. Greeting */}
            <Text style={[styles.greeting, themed.label]}>
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
                <Card style={[globalStyles.card, themed.card]}>
                  <Card.Title
                    title="Default Vehicle"
                    subtitle="Primary vehicle details"
                    titleStyle={[
                      globalStyles.cardHeaderTitle,
                      themed.cardHeaderTitle,
                    ]}
                    subtitleStyle={[
                      globalStyles.cardHeaderSubtitle,
                      themed.cardHeaderSubtitle,
                    ]}
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
                        ...themed.textDetail,
                      }}
                    >
                      {vehicles.find((v) => v.isDefault).plate} •{" "}
                      {vehicles.find((v) => v.isDefault).brand}{" "}
                      {vehicles.find((v) => v.isDefault).model}
                    </Text>

                    <View
                      style={{
                        marginTop: 6,
                        gap: 6,
                        ...globalStyles.label,
                        ...themed.label,
                      }}
                    >
                      <InfoRow
                        icon="calendar-outline"
                        label="Year"
                        value={vehicles.find((v) => v.isDefault).year}
                        style={{
                          marginTop: 6,
                          gap: 6,
                          ...globalStyles.label,
                          ...themed.label,
                        }}
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
                    {/* Add this link below the maintenance info */}
                    <Pressable onPress={() => setShowDialog(true)}>
                      <Text
                        style={{
                          color: "#3b82f6",
                          fontWeight: "bold",
                          marginTop: 14,
                          textAlign: "right",
                        }}
                      >
                        Change Default Vehicle →
                      </Text>
                    </Pressable>
                  </Card.Content>
                </Card>
              </Pressable>
            ) : (
              <Pressable onPress={() => setShowDialog(true)}>
                <Card style={(globalStyles.card, themed.card)}>
                  <Card.Title
                    title="No Default Vehicle"
                    subtitle="Tap to select one"
                    titleStyle={[
                      globalStyles.cardHeaderTitle,
                      themed.cardHeaderTitle,
                    ]}
                    subtitleStyle={[
                      globalStyles.cardHeaderSubtitle,
                      themed.cardHeaderSubtitle,
                    ]}
                    left={() => (
                      <Avatar.Icon
                        icon="alert-circle"
                        size={48}
                        style={{ backgroundColor: "#f87171" }}
                      />
                    )}
                  />
                  <Card.Content>
                    <Text style={[globalStyles.textDetail, themed.textDetail]}>
                      You currently have no default vehicle selected.
                    </Text>
                    <Text style={[globalStyles.textDetail, themed.textDetail]}>
                      Tap here to add or select a default vehicle.
                    </Text>
                  </Card.Content>
                </Card>
              </Pressable>
            )}

            {/* 3. Plate Search */}
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

            {/* 4. Quick Actions */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsContainer}>
              <QuickActionCard
                icon="car-emergency"
                label="Emergency Guides"
                color="#dc2626"
                bgColor="#ffe4e6"
                onPress={() => router.push("/tipsManage/EmergencyGuidesScreen")}
              />
              <QuickActionCard
                icon="lightbulb-on-outline" // Changed icon here
                label="Tips"
                color="#ca8a04"
                bgColor="#fef3c7"
                onPress={() => router.push("/tipsManage/TipViewerScreen")}
                useMaterialCommunity // Pass a prop to force MaterialCommunityIcons
              />
            </View>

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
                  <Card style={[globalStyles.card, themed.card]}>
                    <Text
                      style={[globalStyles.vehicleName, themed.vehicleName]}
                    >
                      {v.plate} - {v.brand} {v.model}
                    </Text>
                    <Text style={[globalStyles.textDetail, themed.textDetail]}>
                      Vehicle Color: {v.color ?? "N/A"}
                    </Text>
                    <Text style={[globalStyles.textDetail, themed.textDetail]}>
                      Year: {v.year}
                    </Text>
                    <Text style={[globalStyles.textDetail, themed.textDetail]}>
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
                  style={{
                    color: "#3b82f6",
                    marginTop: 8,
                    fontWeight: "bold",
                  }}
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
        style={[globalStyles.addButton, themed.addButton]}
        onPress={() => router.push("/vehicleManage/add-new-vehicle")}
      >
        <Ionicons name="add-circle" size={28} color={theme.colors.onPrimary} />
        <Text style={[globalStyles.addText, { color: theme.colors.onPrimary }]}>
          Add Vehicle
        </Text>
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
    </View>
  );
}

const QuickActionCard = ({
  icon,
  label,
  color,
  bgColor,
  onPress,
  useMaterialCommunity,
}) => {
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

  // Use MaterialCommunityIcons for "car-emergency" and "lightbulb-on-outline", Ionicons otherwise
  const IconComponent =
    icon === "car-emergency" ||
    icon === "lightbulb-on-outline" ||
    useMaterialCommunity
      ? MaterialCommunityIcons
      : Ionicons;

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
        <IconComponent name={icon} size={32} color={color} />
        <Text style={styles.quickActionText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};

const InfoRow = ({ icon, label, value }) => {
  const theme = useTheme();

  return (
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
        color={theme.colors.onSurfaceVariant || "#64748b"}
        style={{ width: 24, marginRight: 8 }}
      />
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.onSurfaceVariant || "#64748b",
          width: 90,
        }}
      >
        {label}:
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: "500",
          color: theme.colors.onSurface || "#1e293b",
          flexShrink: 1,
        }}
      >
        {value}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 30,
    paddingBottom: 10,
    backgroundColor: "transparent",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    paddingBottom: 8,
  },
  quickActionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 10,
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
  quickActionText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
  },
});
