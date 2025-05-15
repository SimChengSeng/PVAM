import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../config/FirebaseConfig"; // Firebase configuration
import { getLocalStorage } from "../../service/Storage"; // Local storage utility
import { globalStyles } from "../../styles/globalStyles";
import { useRouter } from "expo-router";
// import CarMaintenanceViewer from "../vehicle-manage/components/CarMaintenanceViewer"; // 3D car viewer component
import { GestureHandlerRootView } from "react-native-gesture-handler"; // Gesture handler for 3D viewer

const MaintenanceScreen = () => {
  const router = useRouter();
  const [records, setRecords] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming"); // upcoming, completed, all
  const [refreshing, setRefreshing] = useState(false);

  // Fetch maintenance records from Firestore
  const fetchMaintenanceRecords = async () => {
    const user = await getLocalStorage("userDetail");

    if (!user || !user.email) {
      console.error("User email is undefined");
      return;
    }

    try {
      const q = query(
        collection(db, "maintenanceRecords"),
        where("userEmail", "==", user.email)
      );

      const querySnapshot = await getDocs(q);
      const maintenanceList = [];

      querySnapshot.forEach((doc) => {
        maintenanceList.push({ id: doc.id, ...doc.data() });
      });

      setRecords(maintenanceList);
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
    }
  };

  // Mark a maintenance record as complete
  const markComplete = async (recordId) => {
    try {
      const recordRef = doc(db, "maintenanceRecords", recordId);
      await updateDoc(recordRef, {
        statusDone: true,
        updatedAt: new Date(),
      });
      fetchMaintenanceRecords(); // Refresh the list
    } catch (error) {
      console.error("Error marking record as complete:", error);
    }
  };

  // Filter records based on the active tab
  const filterRecords = () => {
    if (activeTab === "upcoming") {
      return records.filter((record) => !record.statusDone);
    } else if (activeTab === "completed") {
      return records.filter((record) => record.statusDone);
    }
    return records; // Default: all records
  };

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMaintenanceRecords();
    setRefreshing(false);
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchMaintenanceRecords();
  }, []);

  const renderRecord = ({ item }) => (
    <View style={styles.recordCard}>
      <View style={styles.recordInfo}>
        <Text style={styles.recordType}>{item.type}</Text>
        <Text style={styles.recordVehicle}>{item.vehicleName}</Text>
        <Text style={styles.recordDate}>
          Due on: {item.nextServiceDate} ({item.nextServiceMileage} km)
        </Text>
      </View>
      <View style={styles.recordActions}>
        <TouchableOpacity
          style={styles.detailsButton}
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
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
        {!item.statusDone && (
          <TouchableOpacity
            style={styles.completeButton}
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
            <Text style={styles.completeButtonText}>Mark as Done</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* <CarMaintenanceViewer /> */}
      {/* Removed the semicolon here */}
      <Text style={styles.title}>Maintenance</Text>
      <Text style={styles.subtitle}>Track and manage vehicle maintenance.</Text>

      {/* Tabs for filtering */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "upcoming" && styles.activeTab]}
          onPress={() => setActiveTab("upcoming")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "upcoming" && styles.activeTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "completed" && styles.activeTab]}
          onPress={() => setActiveTab("completed")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "completed" && styles.activeTabText,
            ]}
          >
            Completed
          </Text>
        </TouchableOpacity>
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
            All Records
          </Text>
        </TouchableOpacity>
      </View>

      {/* Maintenance Records */}
      <FlatList
        data={filterRecords()}
        keyExtractor={(item) => item.id}
        renderItem={renderRecord}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.list}
      />

      {/* <Pressable
        style={globalStyles.addButton}
        onPress={() => router.push("/add-new-maintenance")}
      >
        <Ionicons name="add-circle" size={28} color="#fff" />
        <Text style={globalStyles.addText}>Add Vehicle</Text>
      </Pressable> */}
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
  recordCard: {
    backgroundColor: "#fff",
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
    color: "#333",
  },
  recordVehicle: {
    fontSize: 16,
    color: "#666",
  },
  recordDate: {
    fontSize: 14,
    color: "#999",
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
    backgroundColor: "#007aff",
  },
  detailsButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  completeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#4caf50",
  },
  completeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default MaintenanceScreen;
