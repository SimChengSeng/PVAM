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
  Button,
  TextInput,
  Text,
  Provider,
  Divider,
  useTheme,
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
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, getThemedStyles } from "../../styles/globalStyles";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MaintenanceUpdateForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();
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

  const handleUpdate = async () => {
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
        statusDone: true,
        currentServiceMileage: parseInt(currentMileage),
        ServiceDate:
          serviceDate && typeof serviceDate.toISOString === "function"
            ? serviceDate.toISOString().split("T")[0]
            : "",
        updatedAt: serverTimestamp(),
      });
      Alert.alert("Success", "Record marked as done.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
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

  const formatCurrency = (val) =>
    val !== undefined && val !== null && val !== ""
      ? `RM ${Number(val).toFixed(2)}`
      : "-";

  return (
    <Provider>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          Update Maintenance
        </Text>
        {!showConfirm ? (
          <>
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              please review and finalize
            </Text>
            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Services
            </Text>
            {services.map((service, index) => (
              <Card
                key={index}
                style={[
                  styles.serviceCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Card.Content>
                  <View style={styles.serviceRow}>
                    <Button
                      icon="delete"
                      mode="text"
                      onPress={() => handleDeleteService(service.id)}
                      compact
                      style={{ marginRight: 4 }}
                      textColor={theme.colors.error}
                    >
                      Remove
                    </Button>
                    <TextInput
                      label="Service Name"
                      mode="outlined"
                      style={{
                        ...styles.serviceNameInput,
                        backgroundColor: theme.colors.surface,
                      }}
                      value={service.name}
                      onChangeText={(text) =>
                        updateService(service.id, "name", text)
                      }
                      theme={{ colors: { primary: theme.colors.primary } }}
                      textColor={theme.colors.onSurface}
                    />
                    <TextInput
                      label="Cost (RM)"
                      mode="outlined"
                      keyboardType="numeric"
                      style={styles.costInput}
                      value={service.cost?.toString() || ""}
                      onChangeText={(text) =>
                        updateService(service.id, "cost", text)
                      }
                      theme={{
                        colors: {
                          primary: theme.colors.primary,
                          background: theme.colors.surface,
                          text: theme.colors.onSurface,
                          placeholder: theme.colors.onSurfaceVariant,
                        },
                      }}
                      textColor={theme.colors.onSurface}
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
                textColor={theme.colors.primary}
              >
                Undo Remove
              </Button>
            )}
            <Button
              mode="contained"
              style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
              onPress={addService}
              icon="plus"
              textColor={theme.colors.onPrimary}
            >
              Add Service
            </Button>

            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Summary
            </Text>
            <TextInput
              label="Labor Cost"
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              value={laborCost}
              onChangeText={setLaborCost}
              theme={{ colors: { primary: theme.colors.primary } }}
              textColor={theme.colors.onSurface}
            />
            <TextInput
              label="Service Tax"
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              value={serviceTax}
              onChangeText={setServiceTax}
              theme={{ colors: { primary: theme.colors.primary } }}
              textColor={theme.colors.onSurface}
            />
            <TextInput
              label="Additional Notes"
              mode="outlined"
              style={[styles.input, { backgroundColor: theme.colors.surface }]}
              value={notes}
              multiline
              onChangeText={setNotes}
              theme={{ colors: { primary: theme.colors.primary } }}
              textColor={theme.colors.onSurface}
            />

            <Text
              style={[styles.sectionTitle, { color: theme.colors.primary }]}
            >
              Total Cost:{" "}
              <Text style={{ color: theme.colors.primary }}>
                RM {totalCost}
              </Text>
            </Text>

            <Card
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
            >
              <Card.Title
                title="Service History Info"
                titleStyle={{ color: theme.colors.primary }}
              />
              <Card.Content>
                <TextInput
                  label="Current Mileage (km)"
                  mode="outlined"
                  keyboardType="numeric"
                  style={{
                    ...styles.input,
                    backgroundColor: theme.colors.surface,
                  }}
                  value={currentMileage}
                  onChangeText={setCurrentMileage}
                  theme={{ colors: { primary: theme.colors.primary } }}
                  textColor={theme.colors.onSurface}
                />
                <Button
                  icon={() => (
                    <Ionicons
                      name="calendar-outline"
                      size={18}
                      color={theme.colors.primary}
                    />
                  )}
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.input}
                  textColor={theme.colors.primary}
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
              style={{
                marginVertical: 16,
                backgroundColor: theme.colors.primary,
              }}
              textColor={theme.colors.onPrimary}
            >
              Preview & Confirm
            </Button>
            <Button
              mode="outlined"
              style={{ marginBottom: 16, borderColor: theme.colors.primary }}
              textColor={theme.colors.primary}
              onPress={() => router.back()}
            >
              Cancel Edit
            </Button>
          </>
        ) : (
          <>
            <Card style={[styles.card, getThemedStyles.card]}>
              <Card.Title
                title="✅ Maintenance Summary"
                titleStyle={{ color: theme.colors.primary }}
              />
              <Card.Content>
                <View style={{ marginBottom: 12 }}>
                  <Text style={styles.label}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={theme.colors.primary}
                    />{" "}
                    Service Date:{" "}
                    <Text style={styles.value}>
                      {nextServiceDate.toISOString().split("T")[0]}
                    </Text>
                  </Text>
                  <Text style={styles.label}>
                    <Ionicons
                      name="speedometer-outline"
                      size={16}
                      color={theme.colors.primary}
                    />{" "}
                    Mileage:{" "}
                    <Text style={styles.value}>{currentMileage} km</Text>
                  </Text>
                  <Text style={styles.label}>
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color={theme.colors.primary}
                    />{" "}
                    Mechanic:{" "}
                    <Text style={styles.value}>{mechanic || "—"}</Text>
                  </Text>
                  <Text style={styles.label}>
                    <Ionicons
                      name="document-text-outline"
                      size={16}
                      color={theme.colors.primary}
                    />{" "}
                    Notes:{" "}
                    <Text style={styles.value}>{notes?.trim() || "—"}</Text>
                  </Text>
                </View>
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

                <Text
                  style={[
                    styles.total,
                    { fontSize: 17, color: theme.colors.primary },
                  ]}
                >
                  💰 Total Cost: RM {totalCost}
                </Text>

                <Divider style={styles.divider} />
              </Card.Content>
            </Card>

            <View style={styles.buttonRow}>
              <Button
                mode="contained"
                style={[
                  styles.saveBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                textColor={theme.colors.onPrimary}
                onPress={handleSaveUpdates}
              >
                Save Updates
              </Button>
              <Button
                mode="contained"
                style={[
                  styles.doneBtn,
                  { backgroundColor: theme.colors.success || "#22c55e" },
                ]}
                textColor="#fff"
                onPress={handleUpdate}
              >
                Mark as Done
              </Button>
            </View>
            <Button
              mode="outlined"
              style={{ marginTop: 16, borderColor: theme.colors.primary }}
              textColor={theme.colors.primary}
              onPress={() => setShowConfirm(false)}
            >
              Back to Edit
            </Button>
          </>
        )}
      </ScrollView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 50,
    minHeight: 600,
  },
  title: {
    marginBottom: 8,
    fontWeight: "bold",
    fontSize: 22,
  },
  subtitle: {
    marginBottom: 16,
    fontSize: 14,
  },
  sectionTitle: {
    marginVertical: 12,
    fontWeight: "bold",
    fontSize: 16,
  },
  serviceCard: {
    marginBottom: 12,
    borderRadius: 10,
    elevation: 1,
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
    borderRadius: 8,
  },
  card: {
    marginBottom: 16,
    borderRadius: 10,
    elevation: 1,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 12,
  },
  saveBtn: {
    flex: 1,
    marginRight: 0,
    borderRadius: 8,
  },
  doneBtn: {
    flex: 1,
    marginLeft: 0,
    borderRadius: 8,
  },
  label: {
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
    fontSize: 14,
  },
  value: {
    fontWeight: "normal",
    color: "#111827",
  },
  total: {
    fontWeight: "bold",
    fontSize: 15,
    marginTop: 4,
  },
  divider: {
    marginVertical: 8,
  },
});
