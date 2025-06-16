import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from "react-native";
import { TextInput, Button, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { db } from "../../../config/FirebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

export default function PlateSearch() {
  const [plate, setPlate] = useState("");
  const theme = useTheme();
  const router = useRouter();

  const showToast = (msg) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      alert(msg);
    }
  };

  const handleSearch = async () => {
    if (!plate.trim()) {
      showToast("Please enter a plate number");
      return;
    }

    try {
      const q = query(
        collection(db, "vehicles"),
        where("plate", "==", plate.trim().toUpperCase())
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        showToast("No vehicle found with that plate.");
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
      showToast("Failed to search vehicle.");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View>
        <TextInput
          label="Plate Number"
          value={plate}
          onChangeText={(text) => setPlate(text.toUpperCase())}
          mode="outlined"
          style={styles.input}
          autoCapitalize="characters"
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        <Button mode="contained" onPress={handleSearch} style={styles.button}>
          Search
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 10,
  },
  input: {
    marginBottom: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
});
