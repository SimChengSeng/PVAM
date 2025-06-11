import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { db } from "../../../config/FirebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function PlateSearch() {
  const [plate, setPlate] = useState("");
  const router = useRouter();

  const handleSearch = async () => {
    if (!plate) return Alert.alert("Error", "Please enter a plate number");

    try {
      const q = query(
        collection(db, "vehicles"),
        where("plate", "==", plate.toUpperCase())
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        Alert.alert("No result", "No vehicle found with that plate.");
        return;
      }

      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      router.push({
        pathname: "/directlyNotify/components/VehicleSelect",
        params: { vehicles: JSON.stringify(results) },
      });
    } catch (err) {
      console.error("Search error:", err);
      Alert.alert("Error", "Failed to search vehicle.");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Enter plate number"
        value={plate}
        onChangeText={(text) => setPlate(text.toUpperCase())}
        style={styles.input}
        autoCapitalize="characters"
      />
      <Button title="Search" onPress={handleSearch} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
});
