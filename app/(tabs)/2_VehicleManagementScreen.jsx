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
import { db } from "../../config/FirebaseConfig";
import { getLocalStorage } from "../../service/Storage";
import { useRouter } from "expo-router";
import { globalStyles, getThemedStyles } from "../../styles/globalStyles";
import { useTheme, Card } from "react-native-paper";

const VehicleManagementScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("year_desc");
  const router = useRouter();
  const theme = useTheme();
  const themed = getThemedStyles(theme);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    GetVehicleList();
  }, []);

  useEffect(() => {
    GetVehicleList();
  }, []);

  const renderVehicle = ({ item }) => (
    <Card style={[globalStyles.card, themed.card]}>
      <View style={styles.vehicleInfo}>
        <Text style={[styles.vehiclePlate, { color: theme.colors.primary }]}>
          {item.plate}
        </Text>
        <Text
          style={[
            styles.vehicleName,
            { color: theme.colors.onSurface, fontWeight: "600" },
          ]}
        >
          {item.brand} {item.model}
        </Text>
        <Text
          style={[styles.vehicleYear, { color: theme.colors.onSurfaceVariant }]}
        >
          {item.year}
        </Text>
      </View>
      <View style={styles.vehicleStatus}>
        {item.status === "good" ? (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={theme.colors.success || "#4caf50"}
          />
        ) : (
          <Ionicons
            name="time"
            size={24}
            color={theme.colors.warning || "#ff9800"}
          />
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.detailsButton,
          { backgroundColor: theme.colors.primary },
        ]}
        onPress={() =>
          router.push({
            pathname: "vehicleManage/VehicleDetailScreen",
            params: item,
          })
        }
      >
        <Text style={styles.detailsButtonText}>View Details</Text>
      </TouchableOpacity>
    </Card>
  );

  return (
    <View
      style={[
        globalStyles.container,
        themed.containerBg,
        { paddingHorizontal: 16, paddingTop: 50 },
      ]}
    >
      <Text style={[styles.title, themed.label]}>My Vehicles</Text>
      <Text style={[styles.subtitle, themed.textDetail]}>
        Manage your registered vehicles.
      </Text>

      <View style={styles.sortRow}>
        <Text style={[styles.sortLabel, { color: theme.colors.onSurface }]}>
          Sort by:
        </Text>

        {/* Year Descending */}
        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: theme.colors.surface },
            sortBy === "year_desc" && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSortBy("year_desc")}
        >
          <Ionicons
            name="arrow-down"
            size={16}
            color={
              sortBy === "year_desc"
                ? theme.colors.onPrimary
                : theme.colors.primary
            }
          />
          <Text
            style={{
              color:
                sortBy === "year_desc"
                  ? theme.colors.onPrimary
                  : theme.colors.primary,
              fontWeight: "600",
              marginLeft: 4,
            }}
          >
            Year
          </Text>
        </TouchableOpacity>

        {/* Year Ascending */}
        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: theme.colors.surface },
            sortBy === "year_asc" && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSortBy("year_asc")}
        >
          <Ionicons
            name="arrow-up"
            size={16}
            color={
              sortBy === "year_asc"
                ? theme.colors.onPrimary
                : theme.colors.primary
            }
          />
          <Text
            style={{
              color:
                sortBy === "year_asc"
                  ? theme.colors.onPrimary
                  : theme.colors.primary,
              fontWeight: "600",
              marginLeft: 4,
            }}
          >
            Year
          </Text>
        </TouchableOpacity>

        {/* Brand A-Z */}
        <TouchableOpacity
          style={[
            styles.sortButton,
            { backgroundColor: theme.colors.surface },
            sortBy === "brand_asc" && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSortBy("brand_asc")}
        >
          <Ionicons
            name="pricetag-outline"
            size={16}
            color={
              sortBy === "brand_asc"
                ? theme.colors.onPrimary
                : theme.colors.primary
            }
          />
          <Text
            style={{
              color:
                sortBy === "brand_asc"
                  ? theme.colors.onPrimary
                  : theme.colors.primary,
              fontWeight: "600",
              marginLeft: 4,
            }}
          >
            Brand A-Z
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[
          styles.tabContainer,
          { backgroundColor: theme.colors.surface },
        ]}
        style={{ maxHeight: 70 }}
        overScrollMode="never"
      >
        {[
          { key: "all", label: "All", icon: "apps-outline" },
          { key: "car", label: "Car", icon: "car-sport-outline" },
          { key: "motorcycle", label: "Motorcycle", icon: "bicycle-outline" },
          { key: "truck", label: "Truck", icon: "bus-outline" },
          { key: "van", label: "Van", icon: "cube-outline" },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabItem,
                {
                  backgroundColor: isActive
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant || "#eee",
                  borderWidth: 1,
                  borderColor: isActive
                    ? theme.colors.primary
                    : theme.colors.outlineVariant || "transparent",
                },
              ]}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={isActive ? theme.colors.onPrimary : theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontWeight: "600",
                  fontSize: 14,
                  color: isActive
                    ? theme.colors.onPrimary
                    : theme.colors.primary,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Vehicle List */}
      {filterVehicles().length > 0 ? (
        <View style={{ flex: 1, width: "100%" }}>
          <FlatList
            key={activeTab + sortBy}
            data={filterVehicles()}
            keyExtractor={(item) => item.id}
            renderItem={renderVehicle}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        </View>
      ) : (
        <View style={globalStyles.emptyState}>
          <Ionicons
            name="car-outline"
            size={64}
            color={theme.colors.outline || "#777"}
          />
          <Text style={[globalStyles.emptyTitle, themed.emptyTitle]}>
            No vehicles added yet
          </Text>
          <Text style={[globalStyles.emptyMessage, themed.emptyMessage]}>
            Tap the button below to add your first vehicle
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
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
    marginRight: 8,
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },

  sortButtonText: {
    marginLeft: 4,
    fontWeight: "600",
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
  },
  vehicleInfo: {
    marginBottom: 8,
  },
  vehiclePlate: {
    fontSize: 18,
    fontWeight: "bold",
  },
  vehicleYear: {
    fontSize: 16,
  },
  vehicleName: {
    fontSize: 14,
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
