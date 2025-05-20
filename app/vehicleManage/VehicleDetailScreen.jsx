import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  FlatList,
} from "react-native";
import { Text, Card, Divider } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { useFocusEffect } from "@react-navigation/native";
import { db } from "../../config/FirebaseConfig";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles } from "../../styles/globalStyles";

export default function VehicleDetailScreen() {
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
  const [healthScore, setHealthScore] = useState(85); // Example health score
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);

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

  useEffect(() => {
    fetchMaintenanceRecords();
  }, []);

  const handleUpdate = async () => {
    try {
      const ref = doc(db, "vehicles", params.id);
      await updateDoc(ref, {
        plate,
        brand,
        model,
        Mileage: parseInt(Mileage),
      });
      Alert.alert("Success", "Mileage updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update mileage.");
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
          },
        })
      }
    >
      <Card style={styles.recordCard}>
        <Card.Title
          title="Maintenance Summary"
          subtitle={`Next Service: ${item.nextServiceDate}`}
          left={(props) => (
            <Ionicons name="construct" size={28} color="#f57c00" {...props} />
          )}
        />
        <Card.Content>
          <Text style={styles.sectionLabel}>Services Included:</Text>
          {item.services?.map((service, idx) => (
            <View key={idx} style={styles.serviceItem}>
              <Ionicons name="checkmark" size={16} color="#4caf50" />
              <Text style={styles.serviceText}>
                {service.name} — {formatCurrency(service.cost)}
              </Text>
            </View>
          ))}
          <Divider style={{ marginVertical: 10 }} />
          <View style={styles.detailRow}>
            <Text style={styles.label}>Mileage:</Text>
            <Text>{item.nextServiceMileage} km</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Labor:</Text>
            <Text>{formatCurrency(item.laborCost)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Tax:</Text>
            <Text>{formatCurrency(item.serviceTax)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Total Cost:</Text>
            <Text style={{ fontWeight: "bold" }}>
              {formatCurrency(item.cost)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Status:</Text>
            <Text style={{ color: item.statusDone ? "#4caf50" : "#f44336" }}>
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
                router.push("/vehicleManage"); // Fallback to vehicle list
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
    { label: "black", colorCode: "#000000" },
    { label: "white", colorCode: "#FFFFFF" },
    { label: "silver", colorCode: "#C0C0C0" },
    { label: "red", colorCode: "#FF0000" },
    { label: "blue", colorCode: "#0000FF" },
    { label: "gray", colorCode: "#808080" },
    { label: "green", colorCode: "#008000" },
    { label: "yellow", colorCode: "#FFFF00" },
    { label: "orange", colorCode: "#FFA500" },
    { label: "brown", colorCode: "#8B4513" },
    { label: "purple", colorCode: "#800080" },
    { label: "gold", colorCode: "#FFD700" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={maintenanceRecords}
        keyExtractor={(item) => item.id}
        renderItem={renderMaintenanceRecord}
        ListHeaderComponent={
          <>
            {/* Vehicle Overview */}
            <View style={styles.vehicleCard}>
              <Text style={styles.vehicleTitle}>{plate}</Text>
              <Text style={styles.vehicleSubtitle}>
                {brand} {model} • {year}
              </Text>
              <Text style={styles.vehicleOverviewTitle}>Vehicle Overview</Text>
              <Text style={styles.vehicleOverviewSubtitle}>
                View and manage your vehicle details and maintenance
              </Text>

              <View style={styles.vehicleDetails}>
                <Text style={styles.detailLabel}>Vehicle Category</Text>
                <Text style={styles.detailValue}>{vehicleCategory}</Text>

                <Text style={styles.detailLabel}>Color</Text>
                <Text style={styles.detailValue}>{color}</Text>
                <Text style={styles.detailLabel}>Mileage</Text>
                <Text style={styles.detailValue}>{Mileage}</Text>
              </View>

              {/* Health Score */}
              <View style={styles.healthScoreCard}>
                <Text style={styles.healthScoreLabel}>Health Score</Text>
                <View style={styles.healthScoreBar}>
                  <View
                    style={[
                      styles.healthScoreFill,
                      { width: `${healthScore}%` },
                    ]}
                  />
                </View>
                <Text style={styles.healthScoreValue}>{healthScore}%</Text>
              </View>
            </View>

            {/* Mileage Update */}
            <View style={styles.mileageCard}>
              <Text style={styles.sectionTitle}>Update Mileage</Text>
              <TextInput
                style={styles.input}
                value={Mileage}
                onChangeText={setMileage}
                keyboardType="numeric"
                placeholder="Enter new mileage"
              />
              <Pressable style={styles.updateButton} onPress={handleUpdate}>
                <Text style={styles.updateButtonText}>Update Mileage</Text>
              </Pressable>
            </View>

            {/* Maintenance Records Section Title */}
            <Text style={styles.sectionTitle}>Upcoming Maintenance</Text>
          </>
        }
        ListFooterComponent={
          <View>
            <Pressable
              style={styles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/maintenanceManage/AddMaintenanceForm",
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
              <Text style={styles.addButtonText}>
                Add New Maintenance Record
              </Text>
            </Pressable>

            <View style={styles.tipsCard}>
              <Text style={styles.sectionTitle}>Maintenance Tips</Text>
              <Text style={styles.tip}>• Check your oil level regularly.</Text>
              <Text style={styles.tip}>
                • Rotate your tires every 10,000 km.
              </Text>
              <Text style={styles.tip}>
                • Replace air filters every 15,000 km.
              </Text>
              <Text style={styles.tip}>• Inspect brakes every 20,000 km.</Text>
            </View>
            <Pressable style={styles.deleteButton} onPress={handleDelete}>
              <Text style={styles.deleteButtonText}>Delete Vehicle</Text>
            </Pressable>
          </View>
        }
        contentContainerStyle={styles.container}
      />

      {/* Floating Add Maintenance Button */}
      <View style={styles.fabContainer}>
        <Pressable
          style={styles.fabButton}
          onPress={() => router.push("/vehicleManage/add-new-vehicle")}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  vehicleCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  vehicleOverviewTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  vehicleOverviewSubtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  vehicleDetails: {
    marginTop: 8,
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
  healthScoreCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: "center",
  },
  healthScoreLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
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
    backgroundColor: "#28a745",
  },
  healthScoreValue: {
    fontSize: 14,
    color: "#333",
  },
  mileageCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  input: {
    backgroundColor: "#f1f3f5",
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  updateButton: {
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  recordCard: {
    marginVertical: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 3,
    padding: 8,
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
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  label: {
    fontWeight: "500",
    color: "#444",
  },
  tipsCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    marginBottom: 12,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
