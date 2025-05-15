import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig"; // Ensure Firebase is configured
import { getLocalStorage } from "../../service/Storage"; // Local storage utility
import { useRouter } from "expo-router";
import { globalStyles } from "../../styles/globalStyles";

const VehicleManagementScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState("all"); // all, maintenance, good
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Fetch vehicle data from Firestore
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

  // Filter vehicles based on the active tab
  const filterVehicles = () => {
    if (activeTab === "maintenance") {
      return vehicles.filter((vehicle) => vehicle.status === "maintenance");
    } else if (activeTab === "good") {
      return vehicles.filter((vehicle) => vehicle.status === "good");
    }
    return vehicles; // Default: all vehicles
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    GetVehicleList();
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    GetVehicleList();
  }, []);

  const renderVehicle = ({ item }) => (
    <View style={styles.vehicleCard}>
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleLicense}>{item.plate}</Text>
        <Text style={styles.vehicleName}>
          {item.brand} {item.model}
        </Text>
        <Text style={styles.vehicleYear}>{item.year}</Text>
      </View>
      <View style={styles.vehicleStatus}>
        {item.status === "good" ? (
          <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
        ) : (
          <Ionicons name="time" size={24} color="#ff9800" />
        )}
      </View>
      <TouchableOpacity
        style={styles.detailsButton}
        onPress={() =>
          router.push({
            pathname: "vehicleManage/VehicleDetailScreen",
            params: item,
          })
        }
      >
        <Text style={styles.detailsButtonText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Vehicles</Text>
      <Text style={styles.subtitle}>Manage your registered vehicles.</Text>

      {/* Tabs for filtering */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "all" && styles.activeTabText,
            ]}
          >
            All Vehicles
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "maintenance" && styles.activeTab]}
          onPress={() => setActiveTab("maintenance")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "maintenance" && styles.activeTabText,
            ]}
          >
            Needs Maintenance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "good" && styles.activeTab]}
          onPress={() => setActiveTab("good")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "good" && styles.activeTabText,
            ]}
          >
            Good Condition
          </Text>
        </TouchableOpacity>
      </View>

      {/* Vehicle List */}
      {filterVehicles().length > 0 ? (
        <FlatList
          data={filterVehicles()}
          keyExtractor={(item) => item.id}
          renderItem={renderVehicle}
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="car-outline" size={64} color="#777" />
          <Text style={styles.emptyTitle}>Add a new vehicle</Text>
          <Text style={styles.emptyMessage}>
            Add your vehicle details to start tracking
          </Text>
          <TouchableOpacity style={styles.addVehicleButton}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={styles.addVehicleButtonText}>Add Vehicle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: "#e0e0e0",
  },
  activeTab: {
    backgroundColor: "#007aff",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
  },
  activeTabText: {
    color: "#fff",
    fontWeight: "bold",
  },
  list: {
    marginTop: 10,
  },
  vehicleCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vehicleInfo: {
    marginBottom: 8,
  },
  vehicleLicense: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  vehicleYear: {
    fontSize: 16,
    color: "#666",
  },
  vehicleName: {
    fontSize: 14,
    color: "#999",
  },
  vehicleStatus: {
    position: "absolute",
    top: 16,
    right: 16,
  },
  detailsButton: {
    marginTop: 8,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#007aff",
    alignItems: "center",
  },
  detailsButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    color: "#555",
    marginTop: 12,
    fontWeight: "600",
  },
  emptyMessage: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    marginTop: 4,
  },
  addVehicleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007aff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 16,
  },
  addVehicleButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007aff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    position: "absolute",
    bottom: 30,
    right: 30,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  addButtonText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "600",
  },
});

export default VehicleManagementScreen;
