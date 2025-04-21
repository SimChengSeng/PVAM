import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  Alert,
} from "react-native";
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";

export default function UpdateVehicle() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [plate, setPlate] = useState(params.plate);
  const [brand, setBrand] = useState(params.brand);
  const [model, setModel] = useState(params.model);
  const [odometer, setOdometer] = useState(params.odometer.toString());

  const handleUpdate = async () => {
    try {
      const ref = doc(db, "vehicles", params.id);
      await updateDoc(ref, {
        plate,
        brand,
        model,
        odometer: parseInt(odometer),
      });
      Alert.alert("Success", "Vehicle updated successfully");
      router.back();
    } catch (error) {
      console.error("Update error:", error);
      Alert.alert("Error", "Failed to update vehicle.");
    }
  };

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
              await deleteDoc(doc(db, "vehicles", params.id)); // vehicleId from route params
              router.back(); // or router.replace("/index") if needed
            } catch (error) {
              console.error("Error deleting vehicle:", error);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Plate Number</Text>
      <TextInput style={styles.input} value={plate} onChangeText={setPlate} />

      <Text style={styles.label}>Brand</Text>
      <TextInput style={styles.input} value={brand} onChangeText={setBrand} />

      <Text style={styles.label}>Model</Text>
      <TextInput style={styles.input} value={model} onChangeText={setModel} />

      <Text style={styles.label}>Odometer</Text>
      <TextInput
        style={styles.input}
        value={odometer}
        onChangeText={setOdometer}
        keyboardType="numeric"
      />

      <Pressable style={styles.saveButton} onPress={handleUpdate}>
        <Text style={styles.saveText}>Update Vehicle</Text>
      </Pressable>

      <Pressable
        onPress={handleDelete}
        style={{
          marginTop: 20,
          backgroundColor: "#ef4444",
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "600" }}>Delete Vehicle</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1e1e2f",
    padding: 20,
  },
  label: {
    color: "#fff",
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#2a2a3d",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#fff",
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  saveText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
