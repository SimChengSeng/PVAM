import React, { useState, useEffect } from "react";
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
import { db } from "../../config/FirebaseConfig";
import { getLocalStorage } from "../../service/Storage";
import { globalStyles, getThemedStyles } from "../../styles/globalStyles";
import { useRouter } from "expo-router";
import { useTheme } from "react-native-paper";

const MaintenanceScreen = () => {
  const router = useRouter();
  const theme = useTheme();
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [refreshing, setRefreshing] = useState(false);
  const themed = getThemedStyles(theme);

  const fetchMaintenanceRecords = async () => {
    const user = await getLocalStorage("userDetail");

    if (!user?.email) return console.error("User email is undefined");

    try {
      const q = query(
        collection(db, "maintenanceRecords"),
        where("userEmail", "==", user.email)
      );

      const querySnapshot = await getDocs(q);
      const maintenanceList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setRecords(maintenanceList);
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
    }
  };

  const filterRecords = () => {
    if (activeTab === "upcoming") return records.filter((r) => !r.statusDone);
    if (activeTab === "completed") return records.filter((r) => r.statusDone);
    return records;
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMaintenanceRecords();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchMaintenanceRecords();
  }, []);

  const renderRecord = ({ item }) => {
    console.log("Maintenance Record Item:", item); // <-- Add this line for debugging

    return (
      <View style={[globalStyles.card, themed.card]}>
        <View style={styles.recordInfo}>
          <Text style={[styles.recordType, { color: theme.colors.onSurface }]}>
            {item.type}
          </Text>
          <Text
            style={[
              styles.recordVehicle,
              { color: theme.colors.onSurfaceVariant },
            ]}
          >
            {item.vehicleName}
          </Text>
          <Text style={[styles.recordDate, { color: theme.colors.outline }]}>
            Due on: {item.plateNumber}
          </Text>
          <Text style={[styles.recordDate, { color: theme.colors.outline }]}>
            Due on: {item.nextServiceDate} ({item.nextServiceMileage} km)
          </Text>
        </View>
        <View style={styles.recordActions}>
          <TouchableOpacity
            style={[
              styles.detailsButton,
              { backgroundColor: theme.colors.primary },
            ]}
            onPress={() =>
              router.push({
                pathname: "/maintenanceManage/MaintenanceDetailScreen",
                params: {
                  ...item,
                  services: JSON.stringify(item.services || []),
                },
              })
            }
          >
            <Text
              style={[
                styles.detailsButtonText,
                { color: theme.colors.onPrimary },
              ]}
            >
              View Details
            </Text>
          </TouchableOpacity>

          {!item.statusDone && (
            <TouchableOpacity
              style={[
                styles.completeButton,
                { backgroundColor: theme.colors.surfaceVariant },
              ]}
              onPress={() =>
                router.push({
                  pathname: "/maintenanceManage/maintenanceUpdateForm",
                  params: {
                    ...item,
                    services: JSON.stringify(item.services),
                  },
                })
              }
            >
              <Text
                style={[
                  styles.completeButtonText,
                  { color: theme.colors.Primary },
                ]}
              >
                Mark as Done
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        globalStyles.container,
        themed.containerBg,
        { paddingHorizontal: 10, paddingTop: 50 },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>
        Maintenance
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Track and manage vehicle maintenance.
      </Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        {["upcoming", "completed", "all"].map((key) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === key
                    ? theme.colors.primary
                    : theme.colors.surfaceVariant,
              },
            ]}
            onPress={() => setActiveTab(key)}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === key
                      ? theme.colors.onPrimary
                      : theme.colors.onSurfaceVariant,
                },
              ]}
            >
              {key === "all"
                ? "All Records"
                : key.charAt(0).toUpperCase() + key.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Record List */}
      <FlatList
        data={filterRecords()}
        keyExtractor={(item) => item.id}
        renderItem={renderRecord}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.list}
      />
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
  tabs: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    marginTop: 10,
  },
  recordCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordInfo: {
    marginBottom: 8,
  },
  recordType: {
    fontSize: 18,
    fontWeight: "bold",
  },
  recordVehicle: {
    fontSize: 16,
  },
  recordDate: {
    fontSize: 14,
  },
  recordActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  detailsButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  detailsButtonText: {
    fontWeight: "bold",
  },
  completeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    fontWeight: "bold",
  },
});

export default MaintenanceScreen;
