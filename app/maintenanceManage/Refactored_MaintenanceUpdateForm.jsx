
import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import {
  Text,
  Button,
  Card,
  TextInput,
  Divider,
  Menu,
  List,
  Checkbox,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, getDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { addMonths } from "date-fns";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function MaintenanceUpdateForm() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    vehicleId,
    plate,
    brand,
    model,
    year,
    mileage,
    services,
    recordId,
    serviceDate,
    mechanic,
    notes,
  } = params;

  const [partList, setPartList] = useState([]);
  const [updatedServices, setUpdatedServices] = useState([]);
  const [laborCost, setLaborCost] = useState("0");
  const [serviceTax, setServiceTax] = useState("0");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const fetchParts = async () => {
      const snap = await getDoc(doc(db, "vehicles", vehicleId));
      if (snap.exists()) {
        setPartList(snap.data().partCondition || []);
      }
    };
    fetchParts();
  }, []);

  useEffect(() => {
    setUpdatedServices(() => {
      try {
        const parsed = typeof services === "string" ? JSON.parse(services) : services;
        return parsed.map((s) => ({
          ...s,
          menuVisible: false,
          selectedService: s.partId,
        }));
      } catch {
        return [];
      }
    });
  }, [services]);

  const updateService = (index, key, value) => {
    setUpdatedServices((prev) => {
      const copy = [...prev];
      copy[index][key] = value;
      return copy;
    });
  };

  const addServiceField = () => {
    setUpdatedServices((prev) => [
      ...prev,
      { selectedService: null, cost: "", menuVisible: false },
    ]);
  };

  const removeServiceField = (index) => {
    setUpdatedServices((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowConfirm(true);
  };

  const handleUpdate = async () => {
    const finalServices = updatedServices
      .map(({ selectedService, cost }) => {
        const part = partList.find((p) => p.partId === selectedService);
        return part && cost
          ? {
              name: part.name,
              partId: part.partId,
              cost: parseFloat(cost),
            }
          : null;
      })
      .filter(Boolean);

    const total =
      finalServices.reduce((sum, s) => sum + (s.cost || 0), 0) +
      parseFloat(laborCost) +
      parseFloat(serviceTax);

    // 1. Update existing record as done
    await updateDoc(doc(db, "maintenanceRecords", recordId), {
      services: finalServices,
      laborCost: parseFloat(laborCost),
      serviceTax: parseFloat(serviceTax),
      cost: total,
      statusDone: true,
      updatedAt: new Date(),
    });

    // 2. Update vehicle partCondition
    const vehicleRef = doc(db, "vehicles", vehicleId);
    const vehicleSnap = await getDoc(vehicleRef);
    if (vehicleSnap.exists()) {
      const vehicleData = vehicleSnap.data();
      const updatedParts = vehicleData.partCondition.map((part) => {
        const matched = finalServices.find((s) => s.partId === part.partId);
        if (!matched) return part;

        const nextDate = addMonths(new Date(), part.defaultLifespanMonth || 6);
        const nextMileage = parseInt(mileage) + (part.defaultLifespanKm || 10000);

        return {
          ...part,
          lastServiceDate: new Date().toISOString().split("T")[0],
          lastServiceMileage: parseInt(mileage),
          nextServiceDate: nextDate.toISOString().split("T")[0],
          nextServiceMileage: nextMileage,
        };
      });

      await updateDoc(vehicleRef, { partCondition: updatedParts });
    }

    Alert.alert("Success", "Maintenance updated and vehicle condition refreshed", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  const totalServiceCost = updatedServices.reduce(
    (sum, s) => sum + parseFloat(s.cost || 0),
    0
  );
  const totalCost = totalServiceCost + parseFloat(laborCost) + parseFloat(serviceTax);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Update Maintenance</Text>

      {!showConfirm ? (
        <>
          <Card style={styles.card}>
            <Card.Title title={`Plate: ${plate}`} subtitle={`${brand} ${model} • ${year}`} />
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Service Details" />
            <Card.Content>
              {updatedServices.map((service, index) => (
                <View key={index} style={styles.serviceBox}>
                  <Text style={styles.serviceTitle}>Service #{index + 1}</Text>

                  <Menu
                    visible={service.menuVisible}
                    onDismiss={() => updateService(index, "menuVisible", false)}
                    anchor={
                      <Button
                        mode="outlined"
                        onPress={() => updateService(index, "menuVisible", true)}
                      >
                        {service.selectedService
                          ? partList.find((p) => p.partId === service.selectedService)?.name
                          : "Select Part"}
                      </Button>
                    }
                  >
                    {partList.map((part) => (
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
                    style={{ marginTop: 8 }}
                  />

                  {updatedServices.length > 1 && (
                    <Button
                      mode="text"
                      onPress={() => removeServiceField(index)}
                      textColor="#c0392b"
                      style={{ alignSelf: "flex-end" }}
                    >
                      Remove
                    </Button>
                  )}
                </View>
              ))}

              <Button mode="contained-tonal" onPress={addServiceField} style={{ marginTop: 8 }}>
                + Add Service
              </Button>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Title title="Cost Summary" />
            <Card.Content>
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
              <Text style={styles.total}>Total: RM {totalCost.toFixed(2)}</Text>
            </Card.Content>
          </Card>

          <Button mode="contained" onPress={handleConfirm} style={{ marginVertical: 16 }}>
            Preview & Confirm
          </Button>
        </>
      ) : (
        <>
          <Card style={styles.card}>
            <Card.Title title="✅ Maintenance Summary" />
            <Card.Content>
              <Text>Plate: {plate}</Text>
              <Text>Model: {brand} {model} ({year})</Text>
              <Divider style={styles.divider} />
              <Text>Mileage: {mileage}</Text>
              <Text>Mechanic: {mechanic || "-"}</Text>
              <Text>Notes: {notes || "-"}</Text>
              <Divider style={styles.divider} />
              <Text style={{ fontWeight: "bold", marginBottom: 4 }}>Services:</Text>
              {updatedServices.map((s, i) => {
                const part = partList.find((p) => p.partId === s.selectedService);
                return (
                  <Text key={i}>
                    • {part?.name || "Unknown"} - RM {s.cost}
                  </Text>
                );
              })}
              <Divider style={styles.divider} />
              <Text style={styles.total}>Total Cost: RM {totalCost.toFixed(2)}</Text>
            </Card.Content>
          </Card>

          <Button mode="contained" onPress={handleUpdate} style={{ marginVertical: 16 }}>
            Save & Mark as Done
          </Button>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#374151",
    marginBottom: 12,
    textAlign: "center",
  },
  serviceBox: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  serviceTitle: {
    fontWeight: "bold",
    marginBottom: 6,
    color: "#4b5563",
  },
  input: {
    marginBottom: 12,
  },
  total: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#111827",
    marginTop: 8,
  },
  divider: {
    marginVertical: 8,
  },
});
