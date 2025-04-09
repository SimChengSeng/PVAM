import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Dynamic greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const fetchVehicles = async () => {
    // Simulate fetching from backend
    setTimeout(() => {
      setVehicles([
        { id: "1", name: "Toyota Corolla", mileage: 12345 },
        { id: "2", name: "Honda Civic", mileage: 54321 },
      ]);
      setRefreshing(false);
    }, 1000);
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchVehicles();
  }, []);

  const renderVehicle = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.vehicleName}>{item.name}</Text>
      <Text style={styles.mileage}>Mileage: {item.mileage} km</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{getGreeting()}, Jamie!</Text>
      <Text style={styles.subText}>You have {vehicles.length} vehicle(s)</Text>

      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderVehicle}
        style={{ width: "100%", marginTop: 20 }}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#fff"
          />
        }
      />

      <Pressable
        style={styles.addButton}
        onPress={() => router.push("/add-new-vehicle")}
      >
        <Ionicons name="add-circle" size={28} color="#fff" />
        <Text style={styles.addText}>Add Vehicle</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e2f",
    alignItems: "center",
    paddingTop: 60,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "600",
    color: "#fff",
  },
  subText: {
    marginTop: 4,
    color: "#bbb",
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
  mileage: {
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
});
