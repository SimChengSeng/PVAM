import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Card,
  Checkbox,
  Button,
  TextInput,
  Text,
  Provider,
} from "react-native-paper";
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

  const handleSaveUpdates = async () => {
    console.log("Save Updates pressed");
    if (!params.id) {
      Alert.alert("Error", "Maintenance record ID is missing.");
      return;
    }

    try {
      const recordRef = doc(db, "maintenanceRecords", params.id);
      const test = await getDoc(recordRef);
      if (!test.exists()) {
        Alert.alert("Error", "Maintenance record not found.");
        return;
      }

      await updateDoc(recordRef, {
        services,
        laborCost: parseFloat(laborCost),
        serviceTax: parseFloat(serviceTax),
        notes,
        currentServiceMileage: parseInt(currentMileage),
        nextServiceDate: maintenanceDate,
        updatedAt: serverTimestamp(),
      });

      Alert.alert("Success", "Your updates have been saved.");
    } catch (error) {
      console.error("Error saving updates:", error);
      Alert.alert(
        "Error",
        error.message || "Something went wrong while saving."
      );
    }
  };

  const handleUpdate = async () => {
    console.log("Mark as Done pressed");

    if (!params.id) {
      Alert.alert("Error", "Maintenance record ID is missing.");
      return;
    }

    try {
      const recordRef = doc(db, "maintenanceRecords", params.id);
      const test = await getDoc(recordRef);
      if (!test.exists()) {
        Alert.alert("Error", "Maintenance record not found.");
        return;
      }

      console.log("Services:", services); // Debugging log
      console.log("Params:", params); // Debugging log

      // Update the current record
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

      // Fetch maintenance interval template
      const maintenanceDetailsRef = doc(
        db,
        "maintenanceDetails",
        params.brand,
        params.vehicleCategory,
        params.model
      );
      const maintenanceDetailsSnap = await getDoc(maintenanceDetailsRef);

      if (!maintenanceDetailsSnap.exists()) {
        throw new Error("Maintenance details not found for this vehicle.");
      }

      const maintenanceDetails = maintenanceDetailsSnap.data();
      console.log("Maintenance Details:", maintenanceDetails); // Debugging log

      const mileage = parseInt(currentMileage);

      const next = maintenanceDetails.serviceIntervals.find(
        (i) => i.interval.km > mileage
      );

      if (!next || !Array.isArray(next.services)) {
        throw new Error("Next service interval or services list is invalid.");
      }

      console.log("Next interval found:", next);
      console.log("Next services:", next.services);

      await addDoc(collection(db, "maintenanceRecords"), {
        userEmail: params.userEmail,
        vehicleId: params.vehicleId,
        type: next.services.map((s) => s.name).join(", "),
        services: next.services,
        mechanic: "N/A",
        laborCost: next.laborCost,
        serviceTax: next.serviceTax,
        cost: next.totalCost,
        notes: next.specialNote || "",
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
        "Record marked as done and next maintenance created.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error updating record:", error);
      Alert.alert("Error", error.message || "Something went wrong");
    }
  };

  const updateService = (id, key, value) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    );
  };

  const addService = () => {
    setServices([
      ...services,
      { id: services.length, name: "", cost: "", checked: true },
    ]);
  };

  return (
    <Provider>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Confirm Maintenance Record
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Estimated — please review and finalize
        </Text>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Services
        </Text>
        {services.map((service, index) => (
          <Card key={index} style={styles.serviceCard}>
            <Card.Content>
              <View style={styles.serviceRow}>
                <Checkbox
                  status={service.checked ? "checked" : "unchecked"}
                  onPress={() =>
                    updateService(service.id, "checked", !service.checked)
                  }
                />
                <TextInput
                  label="Service Name"
                  mode="outlined"
                  style={styles.serviceNameInput}
                  value={service.name}
                  onChangeText={(text) =>
                    updateService(service.id, "name", text)
                  }
                />
                <TextInput
                  label="Cost (RM)"
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.costInput}
                  value={service.cost.toString()}
                  onChangeText={(text) =>
                    updateService(service.id, "cost", text)
                  }
                />
              </View>
            </Card.Content>
          </Card>
        ))}

        <Button
          mode="contained"
          style={styles.addBtn}
          onPress={addService}
          icon="plus"
        >
          Add Service
        </Button>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Summary
        </Text>
        <TextInput
          label="Labor Cost"
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          value={laborCost}
          onChangeText={setLaborCost}
        />
        <TextInput
          label="Service Tax"
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          value={serviceTax}
          onChangeText={setServiceTax}
        />
        <TextInput
          label="Additional Notes"
          mode="outlined"
          style={styles.input}
          value={notes}
          multiline
          onChangeText={setNotes}
        />
        <TextInput
          label="Current Mileage (km)"
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
          value={currentMileage}
          onChangeText={setCurrentMileage}
        />
        <TextInput
          label="Maintenance Date (YYYY-MM-DD)"
          mode="outlined"
          style={styles.input}
          value={maintenanceDate}
          onChangeText={setMaintenanceDate}
        />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Total Cost: RM {totalCost}
        </Text>

        <View style={styles.buttonRow}>
          <Button
            mode="contained"
            style={styles.saveBtn}
            onPress={handleSaveUpdates}
          >
            Save Updates
          </Button>
          <Button
            mode="contained"
            style={styles.doneBtn}
            onPress={handleUpdate}
          >
            Mark as Done
          </Button>
        </View>
      </ScrollView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 16,
    color: "#666",
  },
  sectionTitle: {
    marginVertical: 12,
  },
  serviceCard: {
    marginBottom: 12,
  },
  serviceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  serviceNameInput: {
    flex: 1,
  },
  costInput: {
    width: 100,
  },
  input: {
    marginBottom: 16,
  },
  addBtn: {
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  saveBtn: {
    flex: 1,
    marginRight: 8,
  },
  doneBtn: {
    flex: 1,
    marginLeft: 8,
  },
});
