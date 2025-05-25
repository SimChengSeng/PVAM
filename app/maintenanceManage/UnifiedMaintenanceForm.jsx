import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import {
  Card,
  Text,
  TextInput,
  Button,
  Menu,
  Divider,
  SegmentedButtons,
  Checkbox,
  List,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addDoc, collection, getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Wrench, CalendarDays } from "lucide-react-native";
import { scheduleReminder } from "../../utils/scheduleReminder";
import { addMonths } from "date-fns";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function UnifiedMaintenanceForm() {
  const params = useLocalSearchParams();
  const { vehicleId, plateNumber, brand, model, userEmail } = params;

  const [mode, setMode] = useState("future"); // "future" | "past"
  const [services, setServices] = useState([
    { selectedService: null, cost: "", menuVisible: false },
  ]);
  const [mileage, setMileage] = useState("");
  const [availableParts, setAvailableParts] = useState([]);
  const [notes, setNotes] = useState("");
  const [mechanic, setMechanic] = useState("");
  const [laborCost, setLaborCost] = useState("0");
  const [serviceTax, setServiceTax] = useState("0");
  const [nextServiceDate, setNextServiceDate] = useState(new Date());
  const [nextServiceMileage, setNextServiceMileage] = useState("");
  const [serviceDate, setServiceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [reminderOptions, setReminderOptions] = useState({
    "1d": false,
    "3d": true,
    "7d": false,
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const vehicleDoc = await getDoc(doc(db, "vehicles", vehicleId));
      if (vehicleDoc.exists())
        setAvailableParts(vehicleDoc.data().partCondition || []);
    };
    fetchData();
  }, []);

  const updateService = (index, key, value) => {
    const updated = [...services];
    updated[index][key] = value;
    setServices(updated);
  };

  const addServiceField = () => {
    setServices((prev) => [
      ...prev,
      { selectedService: null, cost: "", menuVisible: false },
    ]);
  };

  const removeServiceField = (index) => {
    setServices((prev) => prev.filter((_, i) => i !== index));
  };

  const totalServiceCost = services.reduce(
    (sum, s) => sum + parseFloat(s.cost || 0),
    0
  );
  const totalCost =
    totalServiceCost + parseFloat(laborCost) + parseFloat(serviceTax);

  const handleConfirm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const serviceDetails = services
      .map(({ selectedService, cost }) => {
        const part = availableParts.find((p) => p.partId === selectedService);
        return part && cost
          ? {
              name: part.name,
              partId: part.partId,
              cost: parseFloat(cost),
            }
          : null;
      })
      .filter(Boolean);

    if (!mileage || serviceDetails.length === 0) {
      Alert.alert("Error", "Please complete all required fields.");
      return;
    }

    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const serviceDetails = services
        .map(({ selectedService, cost }) => {
          const part = availableParts.find((p) => p.partId === selectedService);
          return part && cost
            ? {
                name: part.name,
                partId: part.partId,
                cost: parseFloat(cost),
              }
            : null;
        })
        .filter(Boolean);

      if (!mileage || serviceDetails.length === 0) {
        setLoading(false);
        Alert.alert("Error", "Please complete all required fields.");
        return;
      }

      const data = {
        userEmail,
        vehicleId,
        type: serviceDetails.map((s) => s.name).join(", ") || "N/A",
        services: serviceDetails,
        currentServiceMileage: parseInt(mileage),
        nextServiceDate:
          mode === "future"
            ? nextServiceDate.toISOString().split("T")[0]
            : "N/A",
        nextServiceMileage:
          mode === "future" ? parseInt(nextServiceMileage) || "N/A" : "N/A",
        serviceDate:
          mode === "past" ? serviceDate.toISOString().split("T")[0] : "N/A",
        mechanic: mechanic.trim() || null,
        notes: notes.trim() || null,
        laborCost: parseFloat(laborCost) || 0,
        serviceTax: parseFloat(serviceTax) || 0,
        cost: totalCost,
        statusDone: mode === "past",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await addDoc(collection(db, "maintenanceRecords"), data);

      //update parts condition
      if (mode === "past") {
        const vehicleDocRef = doc(db, "vehicles", vehicleId);
        const vehicleSnap = await getDoc(vehicleDocRef);
        if (vehicleSnap.exists()) {
          const vehicleData = vehicleSnap.data();
          const updatedParts = vehicleData.partCondition.map((part) => {
            const serviced = serviceDetails.find(
              (s) => s.partId === part.partId
            );
            if (serviced) {
              const lastDate = serviceDate.toISOString().split("T")[0];
              const lastMileage = parseInt(mileage);
              const nextMileage = lastMileage + (part.defaultLifespanKm || 0);
              const nextDate = addMonths(
                serviceDate,
                part.defaultLifespanMonth || 0
              )
                .toISOString()
                .split("T")[0];

              return {
                ...part,
                lastServiceDate: lastDate,
                lastServiceMileage: lastMileage,
                nextServiceDate: nextDate,
                nextServiceMileage: nextMileage,
              };
            }
            return part;
          });

          await updateDoc(vehicleDocRef, {
            partCondition: updatedParts,
            updatedAt: new Date(),
          });
        }
      }

      // Schedule reminders for future
      if (mode === "future") {
        const selectedOptions = Object.keys(reminderOptions).filter(
          (key) => reminderOptions[key]
        );
        const reminders = [];
        for (const option of selectedOptions) {
          const reminder = await scheduleReminder(nextServiceDate, option);
          if (reminder) reminders.push({ ...reminder, option, sent: false });
        }
        if (reminders.length > 0) {
          await updateDoc(doc(db, "maintenanceRecords", docRef.id), {
            reminders,
          });
        }
      }

      setLoading(false);
      Alert.alert(
        "Success",
        `${mode === "past" ? "History" : "Reminder"} saved successfully.`,
        [
          {
            text: "OK",
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      setLoading(false);
      Alert.alert("Error", "Failed to save maintenance record.");
    }
  };

  // --- UI ---
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Maintenance Form</Text>
      {!showConfirm ? (
        <>
          <SegmentedButtons
            value={mode}
            onValueChange={setMode}
            buttons={[
              { value: "past", label: "Past Maintenance" },
              { value: "future", label: "Future Reminder" },
            ]}
            style={{ marginBottom: 16 }}
          />
          <Card style={styles.card}>
            <Card.Title
              title={`Plate: ${plateNumber}`}
              subtitle={`Model: ${brand} ${model}`}
            />
            <Card.Content>
              {services.map((service, index) => (
                <View key={index} style={styles.serviceBox}>
                  <Text style={styles.serviceTitle}>Service #{index + 1}</Text>
                  <Menu
                    visible={service.menuVisible}
                    onDismiss={() => updateService(index, "menuVisible", false)}
                    anchor={
                      <Button
                        icon={() => <Wrench size={18} color="#0284c7" />}
                        mode="outlined"
                        onPress={() =>
                          updateService(index, "menuVisible", true)
                        }
                      >
                        {service.selectedService
                          ? availableParts.find(
                              (p) => p.partId === service.selectedService
                            )?.name
                          : "Select Service"}
                      </Button>
                    }
                  >
                    {availableParts.map((part) => (
                      <Menu.Item
                        key={part.partId}
                        onPress={() => {
                          updateService(index, "selectedService", part.partId);
                          updateService(index, "menuVisible", false);
                        }}
                        title={part.name}
                      />
                    ))}
                  </Menu>
                  <TextInput
                    label="Cost (RM)"
                    mode="outlined"
                    keyboardType="numeric"
                    value={service.cost}
                    onChangeText={(text) => updateService(index, "cost", text)}
                    style={{ marginBottom: 8 }}
                  />
                  {services.length > 1 && (
                    <Button
                      icon="trash-can-outline"
                      mode="outlined"
                      onPress={() => removeServiceField(index)}
                      textColor="#b91c1c"
                      style={{
                        borderColor: "#fca5a5",
                        borderRadius: 99,
                        alignSelf: "flex-end",
                      }}
                    >
                      Remove Service
                    </Button>
                  )}
                </View>
              ))}
              <Button
                icon="plus"
                mode="contained"
                onPress={addServiceField}
                style={{
                  marginTop: 4,
                  alignSelf: "center",
                  backgroundColor: "#7c3aed",
                  borderRadius: 99,
                }}
              >
                Add Another Service
              </Button>
            </Card.Content>
          </Card>
          {mode === "future" && (
            <Card style={styles.card}>
              <Card.Title title="Next Service" />
              <Card.Content>
                <TextInput
                  label="Current Mileage (km)"
                  mode="outlined"
                  keyboardType="numeric"
                  value={mileage}
                  onChangeText={setMileage}
                  style={styles.input}
                />
                <TextInput
                  label="Next Service Mileage (km)"
                  mode="outlined"
                  keyboardType="numeric"
                  value={nextServiceMileage}
                  onChangeText={setNextServiceMileage}
                  style={styles.input}
                />
                <Button
                  icon={() => <CalendarDays size={18} color="#0284c7" />}
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.input}
                >
                  {`Next Service Date: ${
                    nextServiceDate.toISOString().split("T")[0]
                  }`}
                </Button>
                {showDatePicker && (
                  <DateTimePicker
                    value={nextServiceDate}
                    mode="date"
                    display="default"
                    onChange={(e, date) => {
                      setShowDatePicker(false);
                      if (date) setNextServiceDate(date);
                    }}
                  />
                )}

                <Text style={{ marginTop: 12, marginBottom: 4 }}>
                  Reminders:
                </Text>
                {Object.keys(reminderOptions).map((key) => (
                  <View
                    key={key}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <Checkbox
                      status={reminderOptions[key] ? "checked" : "unchecked"}
                      onPress={() =>
                        setReminderOptions((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }))
                      }
                    />
                    <Text>
                      {key === "1d"
                        ? "1 day before"
                        : key === "3d"
                        ? "3 days before"
                        : "1 week before"}
                    </Text>
                  </View>
                ))}
              </Card.Content>
            </Card>
          )}
          {mode === "past" && (
            <Card style={styles.card}>
              <Card.Title title="Service History Info" />
              <Card.Content>
                <TextInput
                  label="Mileage (km)"
                  mode="outlined"
                  keyboardType="numeric"
                  value={mileage}
                  onChangeText={setMileage}
                  style={styles.input}
                />
                <Button
                  icon={() => <CalendarDays size={18} color="#0284c7" />}
                  mode="outlined"
                  onPress={() => setShowDatePicker(true)}
                  style={styles.input}
                >
                  {`Service Date: ${serviceDate.toISOString().split("T")[0]}`}
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
          )}
          {/* Advanced Options */}
          <Card style={styles.card}>
            <Card.Title title="Advanced Options" />
            <Card.Content>
              <List.Accordion
                title="Cost Details"
                left={(props) => (
                  <List.Icon {...props} icon="cash-multiple" color="#0284c7" />
                )}
                style={styles.accordion}
                theme={{ colors: { background: "transparent" } }}
              >
                <View style={styles.accordionContent}>
                  <TextInput
                    label="Labor Cost"
                    mode="outlined"
                    keyboardType="numeric"
                    value={laborCost}
                    onChangeText={setLaborCost}
                    style={styles.inputRounded}
                  />
                  <TextInput
                    label="Service Tax"
                    mode="outlined"
                    keyboardType="numeric"
                    value={serviceTax}
                    onChangeText={setServiceTax}
                    style={styles.inputRounded}
                  />
                  <Text style={styles.totalCostText}>
                    Total Cost: RM {totalCost.toFixed(2)}
                  </Text>
                </View>
              </List.Accordion>
              <List.Accordion
                title="Mechanic & Notes"
                left={(props) => (
                  <List.Icon {...props} icon="account-wrench" color="#0284c7" />
                )}
                style={styles.accordion}
                theme={{ colors: { background: "transparent" } }}
              >
                <View style={styles.accordionContent}>
                  <TextInput
                    label="Mechanic"
                    mode="outlined"
                    value={mechanic}
                    onChangeText={setMechanic}
                    style={styles.inputRounded}
                  />
                  <TextInput
                    label="Notes"
                    mode="outlined"
                    multiline
                    value={notes}
                    onChangeText={setNotes}
                    style={styles.inputRounded}
                  />
                </View>
              </List.Accordion>
              <Text style={styles.totalCostText}>
                Total Cost: RM {totalCost.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
          <Button
            icon="check-circle"
            mode="contained-tonal"
            compact
            onPress={handleConfirm}
            style={{ marginVertical: 16 }}
          >
            Review Before Submit
          </Button>
        </>
      ) : (
        <>
          <Card style={styles.previewCard}>
            <Card.Title
              title={
                mode === "future"
                  ? "🧾 Confirm Upcoming Maintenance"
                  : "🧾 Confirm Maintenance Record"
              }
              titleStyle={styles.cardTitle}
            />
            <Card.Content>
              <View style={styles.row}>
                <Text style={styles.label}>🚘 Plate:</Text>
                <Text style={styles.value}>{plateNumber}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>📍 Model:</Text>
                <Text style={styles.value}>
                  {brand} {model}
                </Text>
              </View>
              <Divider style={styles.divider} />
              {mode === "future" ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>📅 Next Service Date:</Text>
                    <Text style={styles.value}>
                      {nextServiceDate.toISOString().split("T")[0]}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>📏 Current Mileage:</Text>
                    <Text style={styles.value}>{mileage} km</Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>🔜 Next Service Mileage:</Text>
                    <Text style={styles.value}>
                      {nextServiceMileage || "-"}
                    </Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.row}>
                    <Text style={styles.label}>🗓 Service Date:</Text>
                    <Text style={styles.value}>
                      {serviceDate.toISOString().split("T")[0]}
                    </Text>
                  </View>
                  <View style={styles.row}>
                    <Text style={styles.label}>📏 Mileage:</Text>
                    <Text style={styles.value}>{mileage} km</Text>
                  </View>
                </>
              )}
              <View style={styles.row}>
                <Text style={styles.label}>🔧 Mechanic:</Text>
                <Text style={styles.value}>{mechanic || "-"}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>🧮 Labor Cost:</Text>
                <Text style={styles.value}>RM {laborCost || 0}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>💸 Service Tax:</Text>
                <Text style={styles.value}>RM {serviceTax || 0}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>📝 Notes:</Text>
                <Text style={styles.value}>{notes || "-"}</Text>
              </View>
              <Divider style={styles.divider} />
              <Text style={[styles.label, { marginBottom: 8 }]}>
                🧰 Services:
              </Text>
              {services.map((service, index) => {
                const part = availableParts.find(
                  (p) => p.partId === service.selectedService
                );
                return part ? (
                  <Text key={index} style={styles.serviceItem}>
                    • {part.name} - RM {service.cost}
                  </Text>
                ) : null;
              })}
              <Divider style={styles.divider} />
              <Text style={styles.total}>
                💰 Total Cost: RM {totalCost.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 16,
            }}
          >
            <Button
              icon="arrow-left"
              mode="outlined"
              compact
              onPress={() => setShowConfirm(false)}
              style={{ flex: 1, marginRight: 8 }}
            >
              Back
            </Button>
            <Button
              icon="content-save-check"
              mode="contained-tonal"
              compact
              onPress={handleSubmit}
              style={{ flex: 1, marginLeft: 8 }}
              loading={loading}
              disabled={loading}
            >
              Confirm & Save
            </Button>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f4f4f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    color: "#4c1d95",
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  serviceBox: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f5f3ff",
    borderWidth: 1,
    borderColor: "#d1c4e9",
  },
  serviceTitle: {
    fontWeight: "bold",
    marginBottom: 4,
    color: "#6b21a8",
  },
  input: {
    marginBottom: 16,
  },
  accordion: {
    backgroundColor: "transparent",
    borderRadius: 8,
    marginBottom: 8,
    overflow: "hidden",
  },
  accordionContent: {
    backgroundColor: "#f8fafc",
    padding: 12,
  },
  inputRounded: {
    marginBottom: 12,
    backgroundColor: "#fff",
  },
  totalCostText: {
    marginVertical: 8,
    fontWeight: "bold",
    fontSize: 16,
  },
  previewCard: {
    borderRadius: 16,
    backgroundColor: "#f9f5ff",
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4c1d95",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontWeight: "600",
    color: "#6b7280",
  },
  value: {
    fontWeight: "500",
    color: "#111827",
  },
  divider: {
    marginVertical: 10,
  },
  serviceItem: {
    marginLeft: 4,
    color: "#4b5563",
    fontWeight: "500",
  },
  total: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#1f2937",
    textAlign: "right",
  },
});
