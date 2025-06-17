import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, Pressable } from "react-native";
import {
  Text,
  Card,
  Divider,
  useTheme,
  Chip,
  ActivityIndicator,
  Searchbar,
} from "react-native-paper";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";

const MaintenanceListScreen = () => {
  const theme = useTheme();
  const router = useRouter();
  const { vehicleId, plateNumber, brand, model, category } =
    useLocalSearchParams();

  const [maintenanceList, setMaintenanceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc");

  useEffect(() => {
    const fetchMaintenance = async () => {
      try {
        const q = query(
          collection(db, "maintenanceRecords"),
          where("vehicleId", "==", vehicleId)
        );
        const snapshot = await getDocs(q);
        const fetched = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMaintenanceList(fetched);
      } catch (e) {
        console.error("Failed to load maintenance list:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenance();
  }, [vehicleId]);

  useEffect(() => {
    let data = maintenanceList.map((item) => ({
      ...item,
      status: item.statusDone ? "Completed" : "Pending",
    }));

    if (filterStatus !== "all") {
      data = data.filter((item) => item.status.toLowerCase() === filterStatus);
    }

    if (search.trim()) {
      data = data.filter((item) =>
        item.services?.some(
          (service) =>
            service.name?.toLowerCase().includes(search.toLowerCase()) ||
            service.partId?.toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    if (sortBy === "date_asc") {
      data.sort(
        (a, b) =>
          new Date(a.serviceDate || a.nextServiceDate) -
          new Date(b.serviceDate || b.nextServiceDate)
      );
    } else if (sortBy === "date_desc") {
      data.sort(
        (a, b) =>
          new Date(b.serviceDate || b.nextServiceDate) -
          new Date(a.serviceDate || a.nextServiceDate)
      );
    } else if (sortBy === "mileage_asc") {
      data.sort(
        (a, b) =>
          (a.currentServiceMileage || a.nextServiceMileage || 0) -
          (b.currentServiceMileage || b.nextServiceMileage || 0)
      );
    } else if (sortBy === "mileage_desc") {
      data.sort(
        (a, b) =>
          (b.currentServiceMileage || b.nextServiceMileage || 0) -
          (a.currentServiceMileage || a.nextServiceMileage || 0)
      );
    }

    setFiltered(data);
  }, [maintenanceList, search, filterStatus, sortBy]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const renderItem = ({ item }) => {
    const services = item.services || [];

    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/maintenanceManage/MaintenanceDetailScreen",
            params: {
              ...item,
              services: JSON.stringify(item.services || []),
              plateNumber,
              brand,
              model,
              category,
            },
          })
        }
        style={{ marginBottom: 16 }}
      >
        <Card
          style={[
            styles.itemContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outline,
            },
          ]}
          elevation={2}
        >
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={[styles.title, { color: theme.colors.primary }]}>
                Maintenance Services
              </Text>
              <Chip
                style={{
                  backgroundColor:
                    item.status === "Completed"
                      ? theme.colors.secondaryContainer
                      : theme.colors.errorContainer,
                }}
                textStyle={{
                  color:
                    item.status === "Completed"
                      ? theme.colors.onSecondaryContainer
                      : theme.colors.onErrorContainer,
                  fontWeight: "bold",
                }}
              >
                {item.status}
              </Chip>
            </View>

            <Divider
              style={{
                marginVertical: 8,
                backgroundColor: theme.colors.outlineVariant,
              }}
            />

            {services.length === 0 ? (
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                No services found.
              </Text>
            ) : (
              services.map((service, idx) => (
                <View key={idx} style={{ marginBottom: 8 }}>
                  <Text
                    style={[
                      styles.label,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Service:{" "}
                    <Text style={{ color: theme.colors.onSurface }}>
                      {service.name || "N/A"}
                    </Text>
                  </Text>
                  {service.cost !== undefined &&
                    service.cost !== null &&
                    service.cost !== "" && (
                      <Text
                        style={[
                          styles.label,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        Cost:{" "}
                        <Text style={{ color: theme.colors.onSurface }}>
                          RM {service.cost}
                        </Text>
                      </Text>
                    )}
                  <Divider style={{ marginVertical: 4 }} />
                </View>
              ))
            )}

            <Text
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Date:{" "}
              <Text style={{ color: theme.colors.onSurface }}>
                {item.status === "Completed"
                  ? item.serviceDate || "N/A"
                  : item.nextServiceDate || "N/A"}
              </Text>
            </Text>
            <Text
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Mileage:{" "}
              <Text style={{ color: theme.colors.onSurface }}>
                {item.status === "Completed"
                  ? item.currentServiceMileage || "N/A"
                  : item.nextServiceMileage || "N/A"}
              </Text>
            </Text>
          </Card.Content>
        </Card>
      </Pressable>
    );
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>
        <Text
          style={{
            fontSize: 20,
            fontWeight: "bold",
            color: theme.colors.primary,
          }}
        >
          {plateNumber} - {brand} {model}
        </Text>
        <Searchbar
          placeholder="Search by part, title, or description"
          value={search}
          onChangeText={setSearch}
          style={{
            marginBottom: 6,
            minHeight: 40,
            backgroundColor: theme.colors.surface,
          }}
          inputStyle={{ color: theme.colors.onSurface }}
          iconColor={theme.colors.primary}
        />
        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          <Chip
            selected={sortBy === "date_desc" || sortBy === "date_asc"}
            onPress={() =>
              setSortBy((prev) =>
                prev === "date_desc" ? "date_asc" : "date_desc"
              )
            }
            style={{
              marginRight: 8,
              backgroundColor: theme.colors.secondaryContainer,
            }}
            textStyle={{
              color: theme.colors.onSecondaryContainer,
              fontWeight: "bold",
            }}
            icon={sortBy === "date_desc" ? "arrow-down" : "arrow-up"}
          >
            Date
          </Chip>

          <Chip
            selected={sortBy === "mileage_desc" || sortBy === "mileage_asc"}
            onPress={() =>
              setSortBy((prev) =>
                prev === "mileage_desc" ? "mileage_asc" : "mileage_desc"
              )
            }
            style={{
              marginRight: 8,
              backgroundColor: theme.colors.secondaryContainer,
            }}
            textStyle={{
              color: theme.colors.onSecondaryContainer,
              fontWeight: "bold",
            }}
            icon={sortBy === "mileage_desc" ? "arrow-down" : "arrow-up"}
          >
            Mileage
          </Chip>
        </View>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            rowGap: 6,
            marginBottom: 8,
          }}
        >
          {["all", "completed", "pending"].map((status) => {
            const isActive = filterStatus === status;
            return (
              <Chip
                key={status}
                selected={isActive}
                onPress={() => setFilterStatus(status)}
                style={{
                  marginRight: 8,
                  backgroundColor: isActive
                    ? theme.colors.primary
                    : theme.colors.secondaryContainer,
                }}
                textStyle={{
                  color: isActive
                    ? theme.colors.onPrimary
                    : theme.colors.onSecondaryContainer,
                  fontWeight: "bold",
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Chip>
            );
          })}
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={{ color: theme.colors.onBackground }}>
              {search.trim()
                ? "No maintenance records match your search."
                : "No maintenance records found for this vehicle."}
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  itemContainer: {
    borderRadius: 12,
    padding: 5,
    marginBottom: 16,
    borderWidth: 1,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  label: { fontSize: 14, marginBottom: 2 },
  description: { fontSize: 14, marginTop: 8 },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default MaintenanceListScreen;
