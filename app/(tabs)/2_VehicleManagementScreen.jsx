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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { getLocalStorage } from "../../service/Storage";
import { useRouter } from "expo-router";
import { globalStyles, getThemedStyles } from "../../styles/globalStyles";
import { useTheme, Card, Chip, Searchbar } from "react-native-paper";

const VehicleManagementScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState("year_desc");
  const [search, setSearch] = useState("");
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
    switch (sortBy) {
      case "year_desc":
        return list
          .slice()
          .sort((a, b) => (parseInt(b.year) || 0) - (parseInt(a.year) || 0));
      case "year_asc":
        return list
          .slice()
          .sort((a, b) => (parseInt(a.year) || 0) - (parseInt(b.year) || 0));
      case "brand_asc":
        return list
          .slice()
          .sort((a, b) => (a.brand || "").localeCompare(b.brand || ""));
      case "brand_desc":
        return list
          .slice()
          .sort((a, b) => (b.brand || "").localeCompare(a.brand || ""));
      default:
        return list;
    }
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
    if (search.trim()) {
      filtered = filtered.filter(
        (v) =>
          (v.plate || "").toLowerCase().includes(search.toLowerCase()) ||
          (v.brand || "").toLowerCase().includes(search.toLowerCase()) ||
          (v.model || "").toLowerCase().includes(search.toLowerCase())
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
        { paddingHorizontal: 8, paddingTop: 40 },
      ]}
    >
      <Text style={[styles.title, themed.label]}>My Vehicles</Text>
      <Text style={[styles.subtitle, themed.textDetail]}>
        Manage your registered vehicles.
      </Text>

      <View style={{ paddingHorizontal: 0, marginBottom: 4, marginTop: 0 }}>
        <Searchbar
          placeholder="Search by plate, brand, or model"
          value={search}
          onChangeText={setSearch}
          style={{
            marginBottom: 6,
            backgroundColor: theme.colors.surface,
            color: theme.colors.onSurface,
            minHeight: 40,
          }}
          inputStyle={{ color: theme.colors.onSurface, fontSize: 15 }}
          iconColor={theme.colors.primary}
        />
        <View style={{ flexDirection: "row", marginBottom: 4 }}>
          {/* Year Sort Toggle */}
          <Chip
            selected={sortBy.startsWith("year")}
            onPress={() =>
              setSortBy((prev) =>
                prev === "year_desc" ? "year_asc" : "year_desc"
              )
            }
            style={{
              marginRight: 4,
              backgroundColor: theme.colors.secondaryContainer,
              height: 32,
            }}
            textStyle={{
              color: theme.colors.onSecondaryContainer,
              fontWeight: "bold",
              fontSize: 13,
            }}
            icon={sortBy === "year_desc" ? "arrow-down" : "arrow-up"}
          >
            Year
          </Chip>

          {/* Brand Sort Toggle */}
          <Chip
            selected={sortBy.startsWith("brand")}
            onPress={() =>
              setSortBy((prev) =>
                prev === "brand_asc" ? "brand_desc" : "brand_asc"
              )
            }
            style={{
              marginRight: 4,
              backgroundColor: theme.colors.secondaryContainer,
              height: 32,
            }}
            textStyle={{
              color: theme.colors.onSecondaryContainer,
              fontWeight: "bold",
              fontSize: 13,
            }}
            icon={
              sortBy === "brand_asc"
                ? "sort-alphabetical-ascending"
                : "sort-alphabetical-descending"
            }
          >
            Brand
          </Chip>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.tabContainer,
            {
              backgroundColor: theme.colors.surface,
              paddingVertical: 6,
              marginBottom: 4,
            },
          ]}
          style={{ maxHeight: 50 }}
          overScrollMode="never"
        >
          {[
            { key: "all", label: "All", icon: "apps" },
            { key: "car", label: "Car", icon: "car" },
            { key: "motorcycle", label: "Motorcycle", icon: "motorbike" },
            { key: "truck", label: "Truck", icon: "truck" },
            { key: "van", label: "Van", icon: "van-passenger" },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            const iconColor = isActive
              ? theme.colors.onPrimary
              : theme.colors.onSecondaryContainer;

            return (
              <Chip
                key={tab.key}
                selected={isActive}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  marginRight: 4,
                  backgroundColor: isActive
                    ? theme.colors.primary
                    : theme.colors.secondaryContainer,
                  height: 32,
                }}
                textStyle={{
                  color: iconColor,
                  fontWeight: "bold",
                  fontSize: 13,
                }}
                icon={() => (
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={16}
                    color={iconColor}
                  />
                )}
              >
                {tab.label}
              </Chip>
            );
          })}
        </ScrollView>
      </View>

      {/* Vehicle List */}
      {filterVehicles().length > 0 ? (
        <View style={{ flex: 1, width: "100%" }}>
          <FlatList
            key={activeTab + sortBy + search}
            data={filterVehicles()}
            keyExtractor={(item) => item.id}
            renderItem={renderVehicle}
            contentContainerStyle={{ paddingBottom: 12 }}
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
            No vehicles found
          </Text>
          <Text style={[globalStyles.emptyMessage, themed.emptyMessage]}>
            Try adjusting your filters or add a new vehicle.
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
    marginBottom: 5,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    paddingVertical: 15,
    marginBottom: 8,
    minHeight: 60,
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
});

export default VehicleManagementScreen;
