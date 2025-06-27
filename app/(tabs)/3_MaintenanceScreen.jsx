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
    return (
      <View
        style={[
          globalStyles.card,
          themed.card,
          {
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 14,
            padding: 0,
            overflow: "hidden",
          },
        ]}
      >
        <View
          style={{
            width: 6,
            height: "100%",
            backgroundColor: item.statusDone
              ? theme.colors.surfaceVariant
              : theme.colors.primary,
          }}
        />
        <View style={{ flex: 1, padding: 16 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <Text
              style={[
                styles.recordTitle,
                { color: theme.colors.primary, fontSize: 18, flex: 1 },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.maintenanceCategory || "Maintenance"}
            </Text>
            <Text
              style={{
                color: item.statusDone
                  ? theme.colors.secondary
                  : theme.colors.primary,
                fontWeight: "bold",
                fontSize: 13,
                marginLeft: 8,
              }}
            >
              {item.statusDone ? "Completed" : "Upcoming"}
            </Text>
          </View>
          <Text
            style={[
              styles.recordTitle,
              { color: theme.colors.onSurface, fontSize: 16, marginBottom: 2 },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.plate}
          </Text>
          <Text
            style={[
              styles.recordVehicle,
              { color: theme.colors.onSurfaceVariant, marginBottom: 2 },
            ]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {item.type}
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={16}
              color={theme.colors.outline}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.recordDate, { color: theme.colors.outline }]}>
              {item.statusDone ? "Serviced on" : "Due on"}: {item.serviceDate} (
              {item.currentServiceMileage} km)
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <Ionicons
              name="cash-outline"
              size={16}
              color={theme.colors.outline}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.recordDate, { color: theme.colors.outline }]}>
              Total cost: RM{item.cost}
            </Text>
          </View>
          {/* Action Buttons */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-end",
              marginTop: 10,
              gap: 8,
            }}
          >
            <TouchableOpacity
              style={[
                styles.detailsButton,
                {
                  backgroundColor: theme.colors.primary,
                  minWidth: 110,
                  alignItems: "center",
                },
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
                  {
                    backgroundColor: theme.colors.secondary,
                    minWidth: 110,
                    alignItems: "center",
                  },
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
                    { color: theme.colors.onSecondary },
                  ]}
                >
                  Mark as Done
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View
      style={[
        globalStyles.container,
        themed.containerBg,
        { paddingHorizontal: 10, paddingTop: 40 },
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
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Ionicons
              name="file-tray-outline"
              size={48}
              color={theme.colors.outline}
              style={{ marginBottom: 12 }}
            />
            <Text
              style={{
                color: theme.colors.onSurfaceVariant,
                fontSize: 16,
                textAlign: "center",
              }}
            >
              {activeTab === "completed"
                ? "No completed maintenance records."
                : activeTab === "upcoming"
                ? "No upcoming maintenance records."
                : "No maintenance records found."}
            </Text>
          </View>
        }
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
    width: "100%",
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
  recordTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  recordVehicle: {
    paddingTop: 8,
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
