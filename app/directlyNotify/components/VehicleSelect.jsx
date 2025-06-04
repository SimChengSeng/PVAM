import React from "react";
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { db } from "../../../config/FirebaseConfig";
import { useRouter } from "expo-router";

export default function VehicleSelect() {
  const { vehicles } = useLocalSearchParams();
  const parsedVehicles = JSON.parse(vehicles);
  const router = useRouter();

  // const handleNotify = async (vehicle) => {
  //   try {
  //     if (!vehicle.userEmail) {
  //       Alert.alert("Error", "Owner info missing.");
  //       return;
  //     }

  //     // 1️⃣ Get the latest pushToken from Firestore (notificationTokens collection)
  //     const tokenDoc = await getDoc(
  //       doc(db, "notificationTokens", vehicle.userId)
  //     );
  //     const tokenData = tokenDoc.data();

  //     console.log("Token data:", tokenData);
  //     console.log("Email:", vehicle.userEmail);

  //     if (!tokenDoc.exists() || !tokenData?.token) {
  //       Alert.alert("Unavailable", "Owner cannot be contacted at this time.");
  //       return;
  //     }

  //     // 2️⃣ Send push notification via Expo
  //     await axios.post("https://exp.host/--/api/v2/push/send", {
  //       to: tokenData.token,
  //       title: "Vehicle Alert",
  //       body: `🚨 Someone is trying to contact you about vehicle ${vehicle.plate}`,
  //       data: {
  //         screen: "NotificationInbox",
  //         plate: vehicle.plate,
  //       },
  //     });

  //     Alert.alert("Success", "Notification sent.");
  //   } catch (err) {
  //     console.error("Push error:", err);
  //     Alert.alert("Error", "Failed to send notification.");
  //   }
  // };

  return (
    <ScrollView style={styles.container}>
      {parsedVehicles.map((vehicle) => (
        <View key={vehicle.id} style={styles.card}>
          <Text style={styles.title}>{vehicle.plateNumber}</Text>
          <Text>
            {vehicle.brand} {vehicle.model} ({vehicle.year})
          </Text>
          <Text>Color: {vehicle.color}</Text>
          <Text>Contactable: {vehicle.isContactable ? "Yes" : "No"}</Text>
          {vehicle.isContactable && (
            <Button
              title="Notify Owner"
              onPress={() => {
                router.push({
                  pathname: "/directlyNotify/components/NotifyForm",
                  params: { vehicle: JSON.stringify(vehicle) },
                });
              }}
            />
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
  },
});
