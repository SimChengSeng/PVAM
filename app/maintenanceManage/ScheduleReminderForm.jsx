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
  HelperText,
  List,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addDoc, collection, getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Checkbox } from "react-native-paper";
import { scheduleReminder } from "../../utils/scheduleReminder";
import { Wrench, Fuel, CalendarDays } from "lucide-react-native";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ScheduleReminderForm() {
  const params = useLocalSearchParams();
  const { vehicleId, plateNumber, brand, model, category, userEmail } = params;

  const [services, setServices] = useState([
    { selectedService: null, cost: "", menuVisible: false },
  ]);
  const [mileage, setMileage] = useState("");
  const [notes, setNotes] = useState("");
  const [availableParts, setAvailableParts] = useState([]);
  const [nextServiceDate, setNextServiceDate] = useState(new Date());
  const [nextServiceMileage, setNextServiceMileage] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mechanic, setMechanic] = useState("");
  const [laborCost, setLaborCost] = useState("0");
  const [serviceTax, setServiceTax] = useState("0");
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const [reminderOptions, setReminderOptions] = useState({
    "1d": false,
    "3d": true,
    "7d": false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehicleDoc = await getDoc(doc(db, "vehicles", vehicleId));
        if (vehicleDoc.exists()) {
          const parts = vehicleDoc.data().partCondition || [];
          setAvailableParts(parts);
        } else {
          console.warn("Vehicle document does not exist.");
          setAvailableParts([]);
        }
      } catch (error) {
        console.error("Error fetching vehicle data:", error);
        setAvailableParts([]);
      }
    };

    fetchData();
  }, []);

  const updateService = (index, key, value) => {
    setServices((prev) => {
      const updated = [...prev];
      updated[index][key] = value;
      return updated;
    });
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

  const handleConfirm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const serviceDetails = services
      .map(({ selectedService, cost }) => {
        const part = availableParts.find((p) => p.partId === selectedService);
        return part
          ? {
              name: part.name,
              partId: part.partId,
              cost: cost ? parseFloat(cost) : null,
            }
          : null;
      })
      .filter(Boolean);

    if (!mileage) {
      Alert.alert("Error", "Please enter the current mileage.");
      return;
    }

    if (serviceDetails.length === 0) {
      Alert.alert("Error", "Please select at least one service.");
      return;
    }

    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    try {
      const serviceDetails = services
        .map(({ selectedService, cost }) => {
          const part = availableParts.find((p) => p.partId === selectedService);
          return part
            ? {
                name: part.name,
                partId: part.partId,
                cost: cost ? parseFloat(cost) : null,
              }
            : null;
        })
        .filter(Boolean);

      const labor = laborCost?.trim() === "" ? null : parseFloat(laborCost);
      const tax = serviceTax?.trim() === "" ? null : parseFloat(serviceTax);
      const notesValue = notes?.trim() === "" ? null : notes;
      const mechanicValue = mechanic?.trim() === "" ? null : mechanic;
      const mileageValue = mileage?.trim() === "" ? null : parseInt(mileage);
      const nextServiceMileageValue =
        nextServiceMileage?.trim() === "" ? null : parseInt(nextServiceMileage);

      const totalCost =
        (serviceDetails.reduce((sum, s) => sum + (s.cost || 0), 0) || 0) +
        (labor || 0) +
        (tax || 0);

      const docRef = await addDoc(collection(db, "maintenanceRecords"), {
        userEmail,
        vehicleId,
        type: serviceDetails.map((s) => s.name).join(", ") || "N/A",
        services: serviceDetails,
        currentServiceMileage: mileageValue || null,
        nextServiceDate: nextServiceDate.toISOString().split("T")[0],
        nextServiceMileage: nextServiceMileageValue,
        notes: notesValue,
        mechanic: mechanicValue,
        laborCost: labor,
        serviceTax: tax,
        cost: totalCost,
        statusDone: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Schedule local reminders for selected options
      const selectedOptions = Object.keys(reminderOptions).filter(
        (key) => reminderOptions[key]
      );

      const reminderData = [];

      for (const option of selectedOptions) {
        const reminder = await scheduleReminder(nextServiceDate, option);
        if (reminder) {
          reminderData.push({
            option,
            reminderId: reminder.reminderId,
            scheduledFor: reminder.scheduledFor,
            sent: false,
          });
        }
      }

      if (reminderData.length > 0) {
        await updateDoc(doc(db, "maintenanceRecords", docRef.id), {
          reminders: reminderData,
        });
      }

      Alert.alert("Success", "Upcoming maintenance reminder scheduled!", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);

      setShowConfirm(false);
    } catch (error) {
      console.error("Failed to save maintenance record:", error);
      Alert.alert("Error", "Failed to save the maintenance reminder.");
    }
  };

  const totalServiceCost = services.reduce(
    (sum, s) => sum + parseFloat(s.cost || 0),
    0
  );
  const totalCost =
    totalServiceCost + parseFloat(laborCost) + parseFloat(serviceTax);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Main Title */}
      <Text style={styles.mainTitle}>New Maintenance</Text>
      {!showConfirm ? (
        <>
          {/* Vehicle Info */}
          <Card style={styles.card}>
            <Card.Title
              title={`Plate: ${plateNumber}`}
              subtitle={`Model: ${brand} ${model}`}
            />
          </Card>

          {/* Services Section */}
          <Card style={styles.card}>
            <Card.Title title="Service Parts" />
            <Card.Content>
              {services.map((service, index) => (
                <View
                  key={index}
                  style={{
                    marginBottom: 16,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: "#f5f3ff", // light purple background
                    borderWidth: 1,
                    borderColor: "#d1c4e9", // light border
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "bold",
                      marginBottom: 4,
                      color: "#6b21a8",
                    }}
                  >
                    Service #{index + 1}
                  </Text>

                  {!service.selectedService && (
                    <HelperText type="error" visible={true}>
                      Service is required
                    </HelperText>
                  )}

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
                        style={{ marginBottom: 8 }}
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

          {/*Next Service Section */}
          <Card style={styles.card}>
            <Card.Title title="Next Service Information" />
            <Card.Content>
              {!mileage && (
                <HelperText type="error" visible={!mileage}>
                  Mileage is required!
                </HelperText>
              )}
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
              >
                {nextServiceDate
                  ? `Next Service Date: ${
                      nextServiceDate.toISOString().split("T")[0]
                    }`
                  : "Select Next Service Date"}
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={nextServiceDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setNextServiceDate(selectedDate);
                  }}
                />
              )}
            </Card.Content>
          </Card>

          {/* Reminder Settings Section */}
          <Card style={styles.card}>
            <Card.Title title="Reminder Settings" />
            <Card.Content>
              <View style={{ marginBottom: 16 }}>
                <Text style={{ marginVertical: 8 }}>
                  Select Reminder Schedule:
                </Text>
                {["1d", "3d", "7d"].map((key) => (
                  <View
                    key={key}
                    style={{ flexDirection: "row", alignItems: "center" }}
                  >
                    <Checkbox
                      status={reminderOptions[key] ? "checked" : "unchecked"}
                      onPress={() => {
                        setReminderOptions((prev) => ({
                          ...prev,
                          [key]: !prev[key],
                        }));
                      }}
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
              </View>
            </Card.Content>
          </Card>

          {/* Advanced Options Section */}
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
              title="Confirm Upcoming Maintenance"
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
                <Text style={styles.value}>{nextServiceMileage || "-"}</Text>
              </View>
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
    backgroundColor: "#f0f2f5",
  },
  card: {
    marginBottom: 16,
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
    backgroundColor: "#ffffff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#555555",
  },
  value: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333333",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 8,
  },
  serviceItem: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 4,
  },
  total: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#6b21a8",
    marginTop: 8,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
});
