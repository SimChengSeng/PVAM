import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Card,
  Checkbox,
  Button,
  TextInput,
  Text,
  Provider,
  Divider,
} from "react-native-paper";
import { db } from "../../config/FirebaseConfig";
import DateTimePicker from "@react-native-community/datetimepicker";
import {
  doc,
  updateDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { Wrench, CalendarDays } from "lucide-react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MaintenanceUpdateForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { vehicleId, userEmail, mechanic } = params;
  const [showConfirm, setShowConfirm] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [lastDeleted, setLastDeleted] = useState(null);

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
  const [nextServiceDate, setNextServiceDate] = useState(new Date());
  const [serviceDate, setServiceDate] = useState(new Date());
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
        nextServiceDate: nextServiceDate.toISOString().split("T")[0],
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

  const handleConfirm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowConfirm(true);
  };

  console.log("Services:", services); // Debugging log
  console.log("Params:", params); // Debugging log

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

      // Update the current record
      await updateDoc(recordRef, {
        services,
        laborCost: parseFloat(laborCost),
        serviceTax: parseFloat(serviceTax),
        notes,
        statusDone: true,
        currentServiceMileage: parseInt(currentMileage),
        ServiceDate:
          serviceDate && typeof serviceDate.toISOString === "function"
            ? serviceDate.toISOString().split("T")[0]
            : "",
        updatedAt: serverTimestamp(),
      });

      // ✅ Fetch vehicle data
      const vehicleDocRef = doc(db, "vehicles", vehicleId);
      const vehicleSnap = await getDoc(vehicleDocRef);
      if (!vehicleSnap.exists()) {
        throw new Error("Vehicle document not found.");
      }
      const vehicleData = vehicleSnap.data();

      // ✅ Update partCondition
      const updatedParts = await Promise.all(
        vehicleData.partCondition.map(async (part) => {
          const serviced = services.find((s) => s.partId === part.partId);
          if (serviced) {
            const lastDate = serviceDate.toISOString().split("T")[0];
            const lastMileage = parseInt(currentMileage);
            const nextMileage = lastMileage + (part.defaultLifespanKm || 0);
            const nextDate = new Date(serviceDate);
            nextDate.setMonth(
              nextDate.getMonth() + (part.defaultLifespanMonth || 0)
            );

            // Create partHistory document
            await addDoc(collection(db, "vehicles", vehicleId, "partHistory"), {
              partId: part.partId,
              partName: part.name,
              vehicleId,
              userEmail,
              serviceDate: lastDate,
              mileage: lastMileage,
              note: notes,
              createdAt: serverTimestamp(),
            });

            return {
              ...part,
              lastServiceDate: lastDate,
              lastServiceMileage: lastMileage,
              nextServiceDate: nextDate.toISOString().split("T")[0],
              nextServiceMileage: nextMileage,
            };
          }
          return part;
        })
      );

      await updateDoc(vehicleDocRef, {
        partCondition: updatedParts,
        updatedAt: serverTimestamp(),
      });

      // ✅ Fetch maintenance interval template
      const maintenanceDetailsRef = doc(
        db,
        "maintenanceDetails",
        params.brand,
        params.category,
        params.model
      );

      const maintenanceDetailsSnap = await getDoc(maintenanceDetailsRef);
      if (!maintenanceDetailsSnap.exists()) {
        throw new Error("Maintenance details not found for this vehicle.");
      }

      const maintenanceDetails = maintenanceDetailsSnap.data();
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
        userEmail,
        vehicleId,
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
        "Record marked as done, part conditions updated, and next maintenance created.",
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

  const handleDeleteService = (id) => {
    const toDelete = services.find((s) => s.id === id);
    setLastDeleted(toDelete);
    setServices(services.filter((s) => s.id !== id));
  };

  const handleUndoDelete = () => {
    if (lastDeleted) {
      setServices((prev) => [...prev, lastDeleted]);
      setLastDeleted(null);
    }
  };

  return (
    <Provider>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Update Maintenance
        </Text>

        {!showConfirm ? (
          <>
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
                    <Button
                      icon="delete"
                      mode="text"
                      onPress={() => handleDeleteService(service.id)}
                      compact
                      style={{ marginRight: 4 }}
                    >
                      Remove
                    </Button>
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
            {lastDeleted && (
              <Button
                mode="outlined"
                icon="undo"
                onPress={handleUndoDelete}
                style={{ marginBottom: 12 }}
              >
                Undo Remove
              </Button>
            )}
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

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Total Cost: RM {totalCost}
            </Text>

            <Card style={styles.card}>
              <Card.Title title="Service History Info" />
              <Card.Content>
                <TextInput
                  label="Current Mileage (km)"
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  value={currentMileage}
                  onChangeText={setCurrentMileage}
                />
                <Button
                  icon={() => <CalendarDays size={18} color="#0284c7" />}
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.input}
                >
                  {`Service Date: ${
                    nextServiceDate.toISOString().split("T")[0]
                  }`}
                </Button>
                {showDatePicker && (
                  <DateTimePicker
                    value={serviceDate}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                      setShowDatePicker(false);
                      if (date) setServiceDate(date);
                    }}
                  />
                )}
              </Card.Content>
            </Card>

            <Button
              mode="contained"
              onPress={handleConfirm}
              style={{ marginVertical: 16 }}
            >
              Preview & Confirm
            </Button>
            <Button
              mode="outlined"
              style={{ marginBottom: 16 }}
              onPress={() => router.back()}
            >
              Cancel Edit
            </Button>
          </>
        ) : (
          <>
            <Card style={styles.card}>
              <Card.Title title="✅ Maintenance Summary" />
              <Card.Content>
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>
                    🗓 Service Date:{" "}
                    <Text style={styles.value}>
                      {nextServiceDate.toISOString().split("T")[0]}
                    </Text>
                  </Text>
                  <Text style={styles.label}>
                    📏 Mileage:{" "}
                    <Text style={styles.value}>{currentMileage} km</Text>
                  </Text>
                  <Text style={styles.label}>
                    🔧 Mechanic:{" "}
                    <Text style={styles.value}>{mechanic || "—"}</Text>
                  </Text>
                  <Text style={styles.label}>
                    📝 Notes:{" "}
                    <Text style={styles.value}>{notes?.trim() || "—"}</Text>
                  </Text>
                </View>
                <Divider style={styles.divider} />

                <Divider style={styles.divider} />

                <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
                  Services:
                </Text>
                {services.length > 0 ? (
                  services
                    .filter((s) => s.checked)
                    .map((s, i) => (
                      <Text key={i}>
                        • {s.name} - RM {parseFloat(s.cost).toFixed(2)}
                      </Text>
                    ))
                ) : (
                  <Text>No services listed.</Text>
                )}

                <Divider style={styles.divider} />

                <Text style={styles.total}>
                  Subtotal: RM{" "}
                  {services
                    .filter((s) => s.checked)
                    .reduce((sum, s) => sum + parseFloat(s.cost || 0), 0)
                    .toFixed(2)}
                </Text>
                <Text style={styles.total}>
                  Labor Cost: RM {parseFloat(laborCost || 0).toFixed(2)}
                </Text>
                <Text style={styles.total}>
                  Service Tax: RM {parseFloat(serviceTax || 0).toFixed(2)}
                </Text>

                <Divider style={styles.divider} />

                <Text style={[styles.total, { fontSize: 17 }]}>
                  💰 Total Cost: RM {totalCost}
                </Text>

                <Divider style={styles.divider} />
              </Card.Content>
            </Card>

            <Button
              mode="contained"
              onPress={handleUpdate}
              style={{ marginVertical: 16 }}
            >
              Save & Mark as Done
            </Button>

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
          </>
        )}
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
  label: {
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  value: {
    fontWeight: "normal",
    color: "#111827",
  },
});
