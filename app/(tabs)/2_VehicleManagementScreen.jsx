import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
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
  const [sortBy, setSortBy] = useState("year_desc"); // "year_desc" | "year_asc" | "brand_asc"
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

  // Add this function to handle sorting
  const sortVehicles = (list) => {
    if (sortBy === "year_desc") {
      return list
        .slice()
        .sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
    }
    if (sortBy === "year_asc") {
      return list
        .slice()
        .sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));
    }
    if (sortBy === "brand_asc") {
      return list
        .slice()
        .sort((a, b) => (a.brand || "").localeCompare(b.brand || ""));
    }
    return list;
  };

  // Filter vehicles based on the active tab
  const filterVehicles = () => {
    let filtered = vehicles;
    if (
      activeTab === "car" ||
      activeTab === "motorcycle" ||
      activeTab === "truck" ||
      activeTab === "van"
    ) {
      filtered = vehicles.filter(
        (vehicle) => vehicle.vehicleType === activeTab
      );
    }
    return sortVehicles(filtered);
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
        <Text style={styles.vehiclePlate}>{item.plate}</Text>
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

      {/* Sort Button */}
      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "year_desc" && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy("year_desc")}
        >
          <Ionicons
            name="arrow-down"
            size={16}
            color={sortBy === "year_desc" ? "#fff" : "#007aff"}
          />
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "year_desc" && styles.sortButtonTextActive,
            ]}
          >
            Year
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "year_asc" && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy("year_asc")}
        >
          <Ionicons
            name="arrow-up"
            size={16}
            color={sortBy === "year_asc" ? "#fff" : "#007aff"}
          />
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "year_asc" && styles.sortButtonTextActive,
            ]}
          >
            Year
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "brand_asc" && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy("brand_asc")}
        >
          <Ionicons
            name="pricetag-outline"
            size={16}
            color={sortBy === "brand_asc" ? "#fff" : "#007aff"}
          />
          <Text
            style={[
              styles.sortButtonText,
              sortBy === "brand_asc" && styles.sortButtonTextActive,
            ]}
          >
            Brand A-Z
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tabs for filtering */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabContainer}
        style={{ maxHeight: 100 }}
        pagingEnabled={false}
        snapToAlignment="start"
        decelerationRate="fast"
        overScrollMode="never"
      >
        {[
          { key: "all", label: "All", icon: "apps-outline" },
          { key: "car", label: "Car", icon: "car-sport-outline" },
          { key: "motorcycle", label: "Motorcycle", icon: "bicycle-outline" },
          { key: "truck", label: "Truck", icon: "bus-outline" },
          { key: "van", label: "Van", icon: "cube-outline" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabItem,
              activeTab === tab.key && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon}
              size={22}
              color={activeTab === tab.key ? "#333" : "#007aff"}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === tab.key && styles.tabLabelActive,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
    left: 15,
  },
  sortLabel: {
    fontSize: 15,
    color: "#666",
    marginRight: 8,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e5e7eb",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  sortButtonActive: {
    backgroundColor: "#007aff",
  },
  sortButtonText: {
    color: "#007aff",
    marginLeft: 4,
    fontWeight: "600",
  },
  sortButtonTextActive: {
    color: "#fff",
  },
  tabContainer: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginBottom: 16,
    minHeight: 60,
  },
  tabItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 130,
    height: 40,
    backgroundColor: "#e5e7eb",
    borderRadius: 30,
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 120,
  },
  tabLabel: {
    fontSize: 16,
    color: "#007aff",
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#333",
    fontWeight: "700",
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
  vehiclePlate: {
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
});

export default VehicleManagementScreen;
