import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  FlatList,
  BackHandler,
} from "react-native";
import {
  Text,
  Card,
  Divider,
  useTheme,
  ActivityIndicator,
} from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { db } from "../../config/FirebaseConfig";
import { calculateVehicleConditionExtended } from "../../utils/calculateVehicleCondition";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, getThemedStyles } from "../../styles/globalStyles";
import VehicleCategoryIcon from "./components/VehicleCategoryIcon";
import Cabriolet from "../../assets/svg/Van-Icon";

export default function VehicleDetailScreen() {
  const theme = useTheme();
  const themed = getThemedStyles(theme);
  const router = useRouter();
  const params = useLocalSearchParams();

  const [plate, setPlate] = useState(params.plate);
  const [brand, setBrand] = useState(params.brand);
  const [model, setModel] = useState(params.model);
  const [year, setYear] = useState(params.year);
  const [color, setColor] = useState(params.color);
  const [vehicleCategory, setVehicleCategory] = useState(
    params.vehicleCategory
  );
  const [Mileage, setMileage] = useState(params.Mileage.toString());
  const [healthScore, setHealthScore] = useState(undefined);
  const [partScores, setPartScores] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [updating, setUpdating] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      fetchMaintenanceRecords();
    }, [])
  );

  // Fetch maintenance records for the vehicle
  const fetchMaintenanceRecords = async () => {
    try {
      const q = query(
        collection(db, "maintenanceRecords"),
        where("vehicleId", "==", params.id)
      );
      const querySnapshot = await getDocs(q);
      const records = [];
      querySnapshot.forEach((doc) => {
        records.push({ id: doc.id, ...doc.data() });
      });
      setMaintenanceRecords(records);
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
    }
  };

  const fetchVehicleWithParts = async (vehicleId) => {
    const vehicleRef = doc(db, "vehicles", vehicleId);
    const vehicleSnap = await getDoc(vehicleRef);
    const vehicleData = vehicleSnap.data();

    vehicleData.partCondition = vehicleSnap.data().partCondition || [];

    return vehicleData;
  };

  const getColor = (score) => {
    if (score >= 85) return "#28a745"; // Green
    if (score >= 60) return "#ffc107"; // Yellow
    return "#dc3545"; // Red
  };

  useEffect(() => {
    fetchMaintenanceRecords();
  }, []);

  useEffect(() => {
    const loadHealthScore = async () => {
      try {
        const vehicleData = await fetchVehicleWithParts(params.id);
        console.log("📦 vehicleData:", vehicleData);

        // Set updated mileage if needed
        setMileage(vehicleData.Mileage.toString());

        const { totalScore, partScores } =
          calculateVehicleConditionExtended(vehicleData);

        console.log("🧠 Health Score:", totalScore);
        console.log("📊 Part Scores:", partScores);

        setHealthScore(totalScore);
        setPartScores(partScores);
      } catch (error) {
        console.error("Failed to calculate health score:", error);
      }
    };

    loadHealthScore();
  }, [params.id]);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const ref = doc(db, "vehicles", params.id);
      await updateDoc(ref, {
        plate,
        brand,
        model,
        Mileage: parseInt(Mileage),
      });

      const vehicleData = await fetchVehicleWithParts(params.id);
      console.log("📦 vehicleData:", vehicleData);
      const { totalScore } = calculateVehicleConditionExtended(vehicleData);
      setHealthScore(totalScore);

      Alert.alert("Success", "Mileage updated and health score recalculated");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert(
        "Error",
        "Mileage updated and health score recalculated. Please try again."
      );
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (days) => {
    if (!days) return "N/A";
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days);
    return targetDate.toLocaleDateString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (value) =>
    `RM ${Number(value).toFixed(2).toLocaleString()}`;

  const renderMaintenanceRecord = ({ item }) => (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/maintenanceManage/MaintenanceDetailScreen",
          params: {
            ...item,
            services: JSON.stringify(item.services),
            plateNumber: params.plate,
            brand: params.brand,
            model: params.model,
            category: params.vehicleCategory,
          },
        })
      }
    >
      <Card style={[globalStyles.card, getThemedStyles.card]}>
        <Card.Title
          title="Maintenance Summary"
          subtitle={`Next Service: ${item.nextServiceDate}`}
          left={(props) => (
            <Ionicons
              name="construct"
              size={28}
              color={theme.colors.primary}
              {...props}
            />
          )}
        />
        <Card.Content>
          <Text
            style={[styles.sectionLabel, { color: theme.colors.onSurface }]}
          >
            Services Included:
          </Text>
          {item.services?.map((service, idx) => (
            <View key={idx} style={styles.serviceItem}>
              <Ionicons
                name="checkmark"
                size={16}
                color={theme.colors.success || "#4caf50"}
              />
              <Text
                style={[styles.serviceText, { color: theme.colors.onSurface }]}
              >
                {service.name} — {formatCurrency(service.cost)}
              </Text>
            </View>
          ))}
          <Divider
            style={{
              marginVertical: 10,
              backgroundColor: theme.colors.outlineVariant,
            }}
          />
          <View style={styles.detailRow}>
            <Text
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Mileage:
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              {item.nextServiceMileage} km
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Labor:
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              {formatCurrency(item.laborCost)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Tax:
            </Text>
            <Text style={[styles.value, { color: theme.colors.onSurface }]}>
              {formatCurrency(item.serviceTax)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Total Cost:
            </Text>
            <Text
              style={[
                styles.value,
                { color: theme.colors.onSurface, fontWeight: "bold" },
              ]}
            >
              {formatCurrency(item.cost)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text
              style={[styles.label, { color: theme.colors.onSurfaceVariant }]}
            >
              Status:
            </Text>
            <Text
              style={{
                color: item.statusDone
                  ? theme.colors.success || "#4caf50"
                  : theme.colors.error || "#f44336",
              }}
            >
              {item.statusDone ? "Completed" : "Pending"}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </Pressable>
  );

  const handleDelete = async () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this vehicle?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "vehicles", params.id));
              if (router.canGoBack()) {
                router.back();
              } else {
                router.push("/(tabs)/1_index");
              }
            } catch (error) {
              console.error("Error deleting vehicle:", error);
            }
          },
        },
      ]
    );
  };

  const vehicleColour = [
    { label: "Black", colorCode: "#000000" },
    { label: "White", colorCode: "#FFFFFF" },
    { label: "Silver", colorCode: "#C0C0C0" },
    { label: "Red", colorCode: "#FF0000" },
    { label: "Blue", colorCode: "#0000FF" },
    { label: "Gray", colorCode: "#808080" },
    { label: "Green", colorCode: "#008000" },
    { label: "Yellow", colorCode: "#FFFF00" },
    { label: "Orange", colorCode: "#FFA500" },
    { label: "Brown", colorCode: "#8B4513" },
    { label: "Purple", colorCode: "#800080" },
    { label: "Gold", colorCode: "#FFD700" },
  ];

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.push("/(tabs)/1_index");
        }
        return true;
      };
      BackHandler.addEventListener("hardwareBackPress", onBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [router])
  );

  const colorObj = vehicleColour.find(
    (c) => c.label.toLowerCase() === color?.toLowerCase()
  );
  const svgColor = colorObj ? colorObj.colorCode : "#000";

  const getSortedUpcoming = (records) => {
    const pending = records.filter((rec) => !rec.statusDone);
    return pending.sort((a, b) => {
      const dateA = new Date(a.nextServiceDate);
      const dateB = new Date(b.nextServiceDate);
      if (dateA - dateB !== 0) return dateA - dateB;
      return (a.nextServiceMileage || 0) - (b.nextServiceMileage || 0);
    });
  };

  const previewMaintenanceRecords = getSortedUpcoming(maintenanceRecords).slice(
    0,
    3
  );

  return (
    <View
      style={{
        flex: 1,
        height: "100%",
        backgroundColor: theme.colors.background,
      }}
    >
      <FlatList
        data={previewMaintenanceRecords}
        keyExtractor={(item) => item.id}
        renderItem={renderMaintenanceRecord}
        ListHeaderComponent={
          <>
            <View
              style={[
                globalStyles.card,
                { backgroundColor: theme.colors.secondaryContainer },
              ]}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View>
                  <Text
                    style={[
                      styles.vehicleTitle,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {plate}
                  </Text>
                  <Text
                    style={[
                      styles.vehicleSubtitle,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {brand} {model} • {year}
                  </Text>
                </View>
                <VehicleCategoryIcon category={vehicleCategory} color={color} />
              </View>
              <Text
                style={[styles.sectionTitle, { color: theme.colors.primary }]}
              >
                Vehicle Overview
              </Text>
              <View style={styles.vehicleDetails}>
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Vehicle Category
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {vehicleCategory}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Color
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {color}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text
                    style={[
                      styles.detailLabel,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    Mileage
                  </Text>
                  <Text
                    style={[
                      styles.detailValue,
                      { color: theme.colors.onSurface },
                    ]}
                  >
                    {Mileage} km
                  </Text>
                </View>
              </View>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/vehicleManage/HealthScoreDetailScreen",
                    params: {
                      healthScore: healthScore?.toString(),
                      partScores: JSON.stringify(partScores),
                      plate,
                      brand,
                      model,
                      year,
                      vehicleId: params.id,
                    },
                  })
                }
              >
                <Card
                  style={[
                    globalStyles.card,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Card.Content>
                    <Text
                      style={[
                        styles.healthScoreLabel,
                        { color: theme.colors.primary },
                      ]}
                    >
                      Health Score
                    </Text>
                    <Text
                      style={[
                        styles.healthScoreSubtitle,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Tap to view part details
                    </Text>
                    <View
                      style={[
                        styles.healthScoreBar,
                        { backgroundColor: theme.colors.secondaryContainer },
                      ]}
                    >
                      <View
                        style={[
                          styles.healthScoreFill,
                          {
                            width: `${healthScore ?? 0}%`,
                            backgroundColor: getColor(healthScore ?? 0),
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.healthScoreValue,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {healthScore !== undefined
                        ? `${healthScore}%`
                        : "Calculating..."}
                    </Text>
                  </Card.Content>
                </Card>
              </Pressable>
            </View>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Update Mileage
            </Text>
            <View
              style={[
                globalStyles.card,
                { backgroundColor: theme.colors.secondaryContainer },
              ]}
            >
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor:
                      theme.colors.elevation?.level1 || theme.colors.background,
                    color: theme.colors.onSurface,
                    borderColor: theme.colors.outline,
                  },
                ]}
                value={Mileage}
                onChangeText={setMileage}
                keyboardType="numeric"
                placeholder="Enter new mileage"
                placeholderTextColor={theme.colors.outline}
                editable={!updating}
              />
              <Pressable
                style={[
                  styles.updateButton,
                  {
                    backgroundColor: theme.colors.primary,
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                ]}
                onPress={handleUpdate}
                disabled={updating}
              >
                {updating && (
                  <ActivityIndicator
                    size={20}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text style={styles.updateButtonText}>
                  {updating ? "Updating..." : "Update Mileage"}
                </Text>
              </Pressable>
            </View>

            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Upcoming Maintenance
            </Text>
          </>
        }
        ListFooterComponent={
          <View>
            <View style={{ flexDirection: "row", gap: 8, marginVertical: 6 }}>
              {getSortedUpcoming(maintenanceRecords).length > 3 && (
                <Pressable
                  style={[
                    styles.addButton,
                    {
                      backgroundColor: theme.colors.primary,
                      flex: 1,
                      marginVertical: 0,
                    },
                  ]}
                  onPress={() =>
                    router.push({
                      pathname: "/maintenanceManage/MaintenanceListScreen",
                      params: {
                        vehicleId: params.id,
                        plateNumber: plate,
                        brand,
                        model,
                        category: vehicleCategory,
                      },
                    })
                  }
                >
                  <Text style={[styles.addButtonText, { color: "#fff" }]}>
                    View All Maintenance
                  </Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.addButton, { flex: 1, marginVertical: 0 }]}
                onPress={() =>
                  router.push({
                    pathname: "/maintenanceManage/UnifiedMaintenanceForm",
                    params: {
                      vehicleId: params.id,
                      plateNumber: params.plate,
                      brand: params.brand,
                      model: params.model,
                      category: params.vehicleCategory,
                      userEmail: params.userEmail,
                    },
                  })
                }
              >
                <Text style={styles.addButtonText}>Add Maintenance Record</Text>
              </Pressable>
            </View>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Maintenance Tips
            </Text>
            <View
              style={[
                globalStyles.card,
                { backgroundColor: theme.colors.secondaryContainer },
              ]}
            >
              <Text style={[styles.tip, { color: theme.colors.onSurface }]}>
                • Check your oil level regularly.
              </Text>
              <Text style={[styles.tip, { color: theme.colors.onSurface }]}>
                • Rotate your tires every 10,000 km.
              </Text>
              <Text style={[styles.tip, { color: theme.colors.onSurface }]}>
                • Replace air filters every 15,000 km.
              </Text>
              <Text style={[styles.tip, { color: theme.colors.onSurface }]}>
                • Inspect brakes every 20,000 km.
              </Text>
            </View>
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete Vehicle</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 32,
  },
  vehicleTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  vehicleSubtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  vehicleDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: "#999",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: "#333",
    marginBottom: 12,
  },
  healthScoreLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  healthScoreSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  healthScoreBar: {
    width: "100%",
    height: 10,
    backgroundColor: "#e9ecef",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  healthScoreFill: {
    height: "100%",
    borderRadius: 5,
  },
  healthScoreValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    textAlign: "right",
  },

  input: {
    backgroundColor: "#f1f3f5",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  updateButtonText: {
    fontWeight: "bold",
    color: "#fff",
  },

  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  serviceText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },

  tip: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  fabContainer: {
    position: "absolute",
    bottom: 16,
    right: 16,
  },
  fabButton: {
    backgroundColor: "#007bff",
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  addButton: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 3,
    alignItems: "center",
  },
  addButtonText: {
    fontWeight: "bold",
    color: "#fff",
  },
});
