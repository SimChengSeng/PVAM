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
  List,
} from "react-native-paper";
import DateTimePicker from "@react-native-community/datetimepicker";
import { addDoc, collection, getDoc, doc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { useLocalSearchParams, useRouter } from "expo-router";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AddMaintenanceRecord() {
  const params = useLocalSearchParams();
  const { vehicleId, plateNumber, brand, model, category, userEmail } = params;

  const [services, setServices] = useState([
    { selectedService: null, cost: "", menuVisible: false },
  ]);
  const [mileage, setMileage] = useState("");
  const [notes, setNotes] = useState("");
  const [availableParts, setAvailableParts] = useState([]);
  const [serviceDate, setServiceDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mechanic, setMechanic] = useState("");
  const [laborCost, setLaborCost] = useState("0");
  const [serviceTax, setServiceTax] = useState("0");
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

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
        return part && cost
          ? {
              name: part.name,
              partId: part.partId,
              cost: parseFloat(cost),
            }
          : null;
      })
      .filter(Boolean);

    if (!mileage || serviceDetails.length === 0 || !serviceDate) {
      Alert.alert("Error", "Please complete all required fields");
      return;
    }

    setShowConfirm(true);
  };

  const handleSubmit = async () => {
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

    const totalCost =
      serviceDetails.reduce((sum, s) => sum + s.cost, 0) +
      parseFloat(laborCost) +
      parseFloat(serviceTax);

    await addDoc(collection(db, "maintenanceRecords"), {
      userEmail,
      vehicleId,
      type: serviceDetails.map((s) => s.name).join(", "),
      services: serviceDetails,
      currentServiceMileage: parseInt(mileage),
      nextServiceDate: "N/A",
      nextServiceMileage: "N/A",
      serviceDate: serviceDate.toISOString().split("T")[0],
      notes,
      mechanic,
      laborCost: parseFloat(laborCost),
      serviceTax: parseFloat(serviceTax),
      cost: totalCost,
      statusDone: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    Alert.alert("Success", "Maintenance record added successfully", [
      {
        text: "OK",
        onPress: () => {
          router.back();
        },
      },
    ]);
    setShowConfirm(false);
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
      <Text style={styles.mainTitle}>Add Maintenance History</Text>
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
                    backgroundColor: "#f5f3ff",
                    borderWidth: 1,
                    borderColor: "#d1c4e9",
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
                  <Menu
                    visible={service.menuVisible}
                    onDismiss={() => updateService(index, "menuVisible", false)}
                    anchor={
                      <Button
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

          {/* Service Date & Mileage */}
          <Card style={styles.card}>
            <Card.Title title="Service Information" />
            <Card.Content>
              <Button
                mode="outlined"
                onPress={() => setShowDatePicker(true)}
                style={styles.input}
              >
                {serviceDate
                  ? `Service Date: ${serviceDate.toISOString().split("T")[0]}`
                  : "Select Service Date"}
              </Button>
              {showDatePicker && (
                <DateTimePicker
                  value={serviceDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setServiceDate(selectedDate);
                  }}
                />
              )}
              <TextInput
                label="Mileage (km)"
                mode="outlined"
                keyboardType="numeric"
                value={mileage}
                onChangeText={setMileage}
                style={styles.input}
              />
            </Card.Content>
          </Card>

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
          {/* Confirmation Preview */}
          <Card style={styles.previewCard}>
            <Card.Title
              title="🧾 Confirm Maintenance Record"
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
                <Text style={styles.label}>🗓 Service Date:</Text>
                <Text style={styles.value}>
                  {serviceDate.toISOString().split("T")[0]}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>📏 Mileage:</Text>
                <Text style={styles.value}>{mileage} km</Text>
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
  mainTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#4c1d95",
    marginBottom: 16,
    textAlign: "center",
  },
});
