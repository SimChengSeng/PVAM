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
      {!showConfirm ? (
        <>
          <Card style={styles.card}>
            <Card.Title
              title={`Plate: ${plateNumber}`}
              subtitle={`Model: ${brand} ${model}`}
            />
          </Card>

          {services.map((service, index) => (
            <View key={index}>
              <View style={styles.input}>
                <Menu
                  visible={service.menuVisible}
                  onDismiss={() => updateService(index, "menuVisible", false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => updateService(index, "menuVisible", true)}
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
              </View>
              <TextInput
                label="Cost (RM)"
                mode="outlined"
                keyboardType="numeric"
                value={service.cost}
                onChangeText={(text) => updateService(index, "cost", text)}
                style={styles.input}
              />
            </View>
          ))}

          <Button
            onPress={addServiceField}
            style={styles.input}
            mode="outlined"
          >
            + Add Another Service
          </Button>

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
          <TextInput
            label="Notes"
            mode="outlined"
            multiline
            value={notes}
            onChangeText={setNotes}
            style={styles.input}
          />
          <TextInput
            label="Mechanic"
            mode="outlined"
            value={mechanic}
            onChangeText={setMechanic}
            style={styles.input}
          />
          <TextInput
            label="Labor Cost"
            mode="outlined"
            keyboardType="numeric"
            value={laborCost}
            onChangeText={setLaborCost}
            style={styles.input}
          />
          <TextInput
            label="Service Tax"
            mode="outlined"
            keyboardType="numeric"
            value={serviceTax}
            onChangeText={setServiceTax}
            style={styles.input}
          />

          <Text style={{ marginBottom: 16, fontWeight: "bold" }}>
            Total Cost: RM {totalCost.toFixed(2)}
          </Text>

          <Button mode="contained" onPress={handleConfirm}>
            Review Before Submit
          </Button>
        </>
      ) : (
        <>
          <Card style={styles.card}>
            <Card.Title title="Confirm Maintenance Record" />
            <Card.Content>
              <Text>Plate: {plateNumber}</Text>
              <Text>
                Model: {brand} {model}
              </Text>
              <Divider style={{ marginVertical: 8 }} />
              <Text>
                Service Date: {serviceDate.toISOString().split("T")[0]}
              </Text>
              <Text>Mileage: {mileage} km</Text>
              <Text>Mechanic: {mechanic}</Text>
              <Text>Labor Cost: RM {laborCost}</Text>
              <Text>Service Tax: RM {serviceTax}</Text>
              <Text>Notes: {notes}</Text>
              <Divider style={{ marginVertical: 8 }} />
              <Text style={{ fontWeight: "bold" }}>Services:</Text>
              {services.map((service, index) => {
                const part = availableParts.find(
                  (p) => p.partId === service.selectedService
                );
                return part ? (
                  <Text key={index}>
                    • {part.name} - RM {service.cost}
                  </Text>
                ) : null;
              })}
              <Divider style={{ marginVertical: 8 }} />
              <Text style={{ fontWeight: "bold" }}>
                Total Cost: RM {totalCost.toFixed(2)}
              </Text>
            </Card.Content>
          </Card>

          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Button
              mode="outlined"
              onPress={() => setShowConfirm(false)}
              style={{ flex: 1, marginRight: 8 }}
            >
              Back
            </Button>
            <Button
              mode="contained"
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
});
