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
        router.push({ pathname: "vehicle-manage/update-vehicle", params: item })
      }
    >
      <View style={styles.card}>
        <Text style={styles.vehicleName}>
          {item.plate} - {item.brand} {item.model}
        </Text>
        <Text style={styles.vehicleDetail}>
          Vehicle Color: {item.color ?? "N/A"}
        </Text>
        <Text style={styles.vehicleDetail}>Year: {item.year}</Text>
      </View>
    </Pressable>
  );

  const GetVehicleList = async () => {
    const user = await getLocalStorage("userDetail");
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
      <View style={[styles.container, { justifyContent: "center" }]}>
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
        style={styles.list}
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

            <Card style={styles.maintenanceCard}>
              <Card.Title
                title="Upcoming Maintenance"
                subtitle="Scheduled maintenance for your vehicles"
                titleStyle={{ color: "#fff" }}
                subtitleStyle={{ color: "#ccc" }}
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
                  vehicles.map((vehicle) => (
                    <View key={vehicle.id} style={styles.maintenanceItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.vehicleName}>
                          {vehicle.brand} {vehicle.model}
                        </Text>
                        <Text style={styles.serviceDetail}>
                          Service on {formatDate(vehicle.NextServiceDate)} (
                          {getRemainingTime(vehicle.NextServiceDate)})
                        </Text>

                        <Text style={styles.serviceDetail}>
                          Mileage: {vehicle.NextServiceMileage ?? "N/A"} km
                        </Text>
                      </View>
                      <Ionicons name="calendar" size={24} color="#fff" />
                    </View>
                  ))
                ) : (
                  <Text style={[styles.serviceDetail, { marginTop: 8 }]}>
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
          <View style={styles.emptyState}>
            <Ionicons name="car-outline" size={64} color="#777" />
            <Text style={styles.emptyTitle}>No vehicles added yet</Text>
            <Text style={styles.emptyMessage}>
              Tap the button below to add your first vehicle
            </Text>
          </View>
        }
      />

      <Pressable
        style={styles.addButton}
        onPress={() => router.push("/add-new-vehicle")}
      >
        <Ionicons name="add-circle" size={28} color="#fff" />
        <Text style={styles.addText}>Add Vehicle</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e2f",
    alignItems: "center",
  },
  list: {
    flex: 1,
    backgroundColor: "#1e1e2f",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  subText: {
    marginTop: 4,
    color: "#bbb",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#2a2a3d",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 4,
  },
  vehicleName: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  vehicleDetail: {
    marginTop: 4,
    color: "#aaa",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    position: "absolute",
    bottom: 30,
    right: 30,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  addText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  serviceDetail: {
    marginTop: 4,
    color: "#aaa",
  },
  maintenanceCard: {
    backgroundColor: "#2a2a3d",
    borderRadius: 16,
    marginTop: 20,
    width: "100%",
    alignSelf: "center",
    paddingBottom: 12,
  },
  maintenanceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    color: "#ccc",
    marginTop: 12,
    fontWeight: "600",
  },
  emptyMessage: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 4,
  },
});
