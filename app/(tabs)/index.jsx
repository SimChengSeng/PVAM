import {
  View,
  FlatList,
  StyleSheet,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  BackHandler, // Import BackHandler
  Alert, // Import Alert for confirmation dialog
} from "react-native";
import { Avatar, Text, Card, Button } from "react-native-paper";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getLocalStorage } from "../../service/Storage";
import { db } from "../../config/FirebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { globalStyles } from "../../styles/globalStyles";

export default function Index() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

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
    };
    loadUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      GetVehicleList();

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
    }, [])
  );

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

  const renderVehicle = ({ item }) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "vehicleManage/VehicleDetailScreen",
          params: item,
        })
      }
    >
      <View style={globalStyles.card}>
        <Text style={globalStyles.vehicleName}>
          {item.plate} - {item.brand} {item.model}
        </Text>
        <Text style={globalStyles.textDetail}>
          Vehicle Color: {item.color ?? "N/A"}
        </Text>
        <Text style={globalStyles.textDetail}>Year: {item.year}</Text>
      </View>
    </Pressable>
  );

  const GetVehicleList = async () => {
    const user = await getLocalStorage("userDetail");

    if (!user || !user.email) {
      console.error("User email is undefined");
      return;
    }

    try {
      const q = query(
        collection(db, "vehicles"),
        where("userEmail", "==", user?.email)
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

  return (
    <>
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderVehicle}
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
            <Text style={styles.greeting}>
              {greeting}, {userName}!
            </Text>
            <Text style={styles.subText}>
              You have {vehicles.length} vehicle(s)
            </Text>

            {vehicles.find((v) => v.isDefault) && (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "vehicleManage/VehicleDetailScreen",
                    params: vehicles.find((v) => v.isDefault),
                  })
                }
              >
                <Card style={styles.defaultCard}>
                  <Card.Title
                    title="Default Vehicle"
                    subtitle="Your primary vehicle"
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
                    <Text style={globalStyles.textDetail}>
                      Color: {vehicles.find((v) => v.isDefault).color ?? "N/A"}
                    </Text>
                    <Text style={globalStyles.textDetail}>
                      Year: {vehicles.find((v) => v.isDefault).year ?? "N/A"}
                    </Text>
                    <Text style={globalStyles.textDetail}>
                      Mileage:{" "}
                      {vehicles.find((v) => v.isDefault).Mileage ?? "N/A"} km
                    </Text>
                  </Card.Content>
                </Card>
              </Pressable>
            )}

            <Card style={styles.maintenanceCard}>
              <Card.Title
                title="Upcoming Maintenance"
                subtitle="Scheduled maintenance for your vehicles"
                titleStyle={{ color: "#333", fontWeight: "bold" }}
                subtitleStyle={{ color: "#333" }}
                left={() => (
                  <Avatar.Icon
                    icon="wrench"
                    size={48}
                    style={{ backgroundColor: "#f44336" }}
                  />
                )}
              />
              <Card.Content>
                {vehicles.length > 0 ? (
                  [...vehicles] // clone array
                    .filter((v) => v.NextServiceDate) // ensure valid date
                    .sort(
                      (a, b) =>
                        new Date(a.NextServiceDate) -
                        new Date(b.NextServiceDate)
                    )
                    .map((vehicle) => (
                      <View key={vehicle.id} style={styles.maintenanceItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={globalStyles.vehicleName}>
                            {vehicle.brand} {vehicle.model}
                          </Text>
                          <Text style={globalStyles.textDetail}>
                            Service on {formatDate(vehicle.NextServiceDate)} (
                            {getRemainingTime(vehicle.NextServiceDate)})
                          </Text>
                          <Text style={globalStyles.textDetail}>
                            Mileage: {vehicle.NextServiceMileage ?? "N/A"} km
                          </Text>
                        </View>
                        <Ionicons name="calendar" size={24} color="#fff" />
                      </View>
                    ))
                ) : (
                  <Text style={[globalStyles.textDetail, { marginTop: 8 }]}>
                    No maintenance scheduled.
                  </Text>
                )}
              </Card.Content>
              <Card.Actions>
                <Button
                  mode="contained"
                  buttonColor="#f44336"
                  textColor="#fff"
                  onPress={() => router.push("/maintenance/add")}
                >
                  Add Maintenance
                </Button>
              </Card.Actions>
            </Card>
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
