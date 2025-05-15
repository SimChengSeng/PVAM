import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Card, Divider, Checkbox, Button } from "react-native-paper";
import { db } from "../../config/FirebaseConfig";
import {
  doc,
  updateDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

export default function MaintenanceUpdateForm() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const [services, setServices] = useState(() => {
    try {
      const parsed =
        typeof params.services === "string"
          ? JSON.parse(params.services)
          : params.services;
      return parsed.map((s, i) => ({ ...s, id: i, checked: true }));
    } catch (e) {
      console.warn("Failed to parse services:", e);
      return [];
    }
  });

  const [laborCost, setLaborCost] = useState(
    params.laborCost?.toString() || "0"
  );
  const [serviceTax, setServiceTax] = useState(
    params.serviceTax?.toString() || "0"
  );
  const [notes, setNotes] = useState(params.notes || "");
  const [statusDone, setStatusDone] = useState(params.statusDone === "true");
  const [currentMileage, setCurrentMileage] = useState(
    params.currentServiceMileage?.toString() || ""
  );
  const [maintenanceDate, setMaintenanceDate] = useState("");
  const [totalCost, setTotalCost] = useState("0.00");

  useEffect(() => {
    const costSum = services.reduce(
      (sum, s) => sum + (parseFloat(s.cost) || 0),
      0
    );
    const total =
      costSum + parseFloat(laborCost || 0) + parseFloat(serviceTax || 0);
    setTotalCost(total.toFixed(2));
  }, [services, laborCost, serviceTax]);

  const handleUpdate = async () => {
    try {
      const recordRef = doc(db, "maintenanceRecords", params.id);

      await updateDoc(recordRef, {
        services,
        laborCost: parseFloat(laborCost),
        serviceTax: parseFloat(serviceTax),
        notes,
        statusDone: true,
        currentServiceMileage: parseInt(currentMileage),
        nextServiceDate: maintenanceDate,
        updatedAt: serverTimestamp(),
      });

      // Create next maintenance record
      const vehicleRef = doc(
        db,
        "maintenanceDetails",
        params.brand,
        params.vehicleCategory,
        params.model
      );
      const vehicleSnap = await getDoc(vehicleRef);

      if (!vehicleSnap.exists())
        throw new Error("Maintenance details not found.");

      const details = vehicleSnap.data();
      const mileage = parseInt(currentMileage);
      const next = details.serviceIntervals.find(
        (i) => i.interval.km > mileage
      );

      if (!next) throw new Error("No next service found for this mileage.");

      await addDoc(collection(db, "maintenanceRecords"), {
        userEmail: params.userEmail,
        vehicleId: params.vehicleId,
        type: next.services.map((s) => s.name).join(", "),
        services: next.services,
        mechanic: "N/A",
        laborCost: next.laborCost,
        serviceTax: next.serviceTax,
        cost: next.totalCost,
        notes: next.specialNote,
        nextServiceDate: "N/A",
        estimateNextServiceDate: next.interval.month,
        nextServiceMileage: next.interval.km,
        currentServiceMileage: mileage,
        statusDone: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      Alert.alert(
        "Success",
        "Record marked as done and next maintenance created."
      );
      router.back();
    } catch (error) {
      console.error("Error updating record:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  const addService = () => {
    setServices([
      ...services,
      { id: services.length, name: "", cost: "", checked: true },
    ]);
  };

  const updateService = (id, key, value) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Confirm Maintenance Record</Text>
      <Text style={styles.subtitle}>
        Estimated — please review and finalize
      </Text>

      <Text style={styles.sectionTitle}>Services</Text>
      {services.map((service, index) => (
        <Card key={index} style={styles.serviceCard}>
          <View style={styles.serviceRow}>
            <Checkbox
              status={service.checked ? "checked" : "unchecked"}
              onPress={() =>
                updateService(service.id, "checked", !service.checked)
              }
            />
            <TextInput
              placeholder="Service name"
              style={styles.serviceNameInput}
              value={service.name}
              onChangeText={(text) => updateService(service.id, "name", text)}
            />
            <TextInput
              placeholder="Cost (RM)"
              keyboardType="numeric"
              style={styles.costInput}
              value={service.cost.toString()}
              onChangeText={(text) => updateService(service.id, "cost", text)}
            />
          </View>
        </Card>
      ))}

      <Pressable style={styles.addBtn} onPress={addService}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addBtnText}>Add Service</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Summary</Text>
      <TextInput
        placeholder="Labor Cost"
        keyboardType="numeric"
        style={styles.input}
        value={laborCost}
        onChangeText={setLaborCost}
      />
      <TextInput
        placeholder="Service Tax"
        keyboardType="numeric"
        style={styles.input}
        value={serviceTax}
        onChangeText={setServiceTax}
      />
      <TextInput
        placeholder="Additional Notes"
        style={styles.input}
        value={notes}
        multiline
        onChangeText={setNotes}
      />
      <TextInput
        placeholder="Current Mileage (km)"
        keyboardType="numeric"
        style={styles.input}
        value={currentMileage}
        onChangeText={setCurrentMileage}
      />
      <TextInput
        placeholder="Maintenance Date (YYYY-MM-DD)"
        style={styles.input}
        value={maintenanceDate}
        onChangeText={setMaintenanceDate}
      />

      <Text style={styles.sectionTitle}>Total Cost: RM {totalCost}</Text>

      <Button mode="contained" style={styles.doneBtn} onPress={handleUpdate}>
        Mark as Done
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 12,
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  serviceNameInput: {
    flex: 1,
    borderBottomWidth: 1,
    padding: 4,
    marginRight: 8,
  },
  costInput: {
    width: 80,
    borderBottomWidth: 1,
    padding: 4,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  doneBtn: {
    backgroundColor: "#28a745",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
});
