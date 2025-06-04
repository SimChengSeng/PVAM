import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Card,
  Text,
  Button,
  TextInput,
  RadioButton,
  Dialog,
  Portal,
  Paragraph,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../../../config/FirebaseConfig";
import axios from "axios";

const GENERAL_MESSAGES = [
  { label: "Car alarm is going off", value: "alarm" },
  { label: "Car lights are on", value: "lights" },
  { label: "Blocking my vehicle", value: "blocking" },
  { label: "Door/trunk is open", value: "open" },
  { label: "Custom message", value: "custom" },
];

export default function NotifyForm() {
  const { vehicle } = useLocalSearchParams();
  const parsedVehicle = JSON.parse(vehicle);
  const router = useRouter();

  const [selectedReason, setSelectedReason] = useState("alarm");
  const [customMessage, setCustomMessage] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);

  const getMessageText = () => {
    const plate = parsedVehicle.plateNumber ?? parsedVehicle.plate;
    const reason = GENERAL_MESSAGES.find((msg) => msg.value === selectedReason);

    if (selectedReason === "custom") {
      return `🚨 Message regarding vehicle ${plate}: ${customMessage}`;
    }

    return `🚨 Attention needed: Vehicle ${plate} - ${reason?.label}`;
  };

  const handleConfirmSend = () => setConfirmVisible(true);
  const handleCancel = () => setConfirmVisible(false);

  const handleSend = async () => {
    setConfirmVisible(false);
    setSending(true);

    try {
      const tokenDoc = await getDoc(
        doc(db, "notificationTokens", parsedVehicle.userId)
      );
      const pushToken = tokenDoc.data()?.token;

      if (!pushToken) {
        alert("Owner cannot be contacted.");
        return;
      }

      const message = getMessageText();

      await axios.post("https://exp.host/--/api/v2/push/send", {
        to: pushToken,
        title: "Vehicle Alert",
        body: message,
        data: {
          screen: "NotificationInbox",
          plate: parsedVehicle.plateNumber ?? parsedVehicle.plate,
        },
      });

      // Log the message to Firestore
      await addDoc(collection(db, "vehicleMessages"), {
        plateNumber: parsedVehicle.plateNumber ?? parsedVehicle.plate,
        vehicleId: parsedVehicle.id,
        senderId: auth.currentUser.uid,
        receiverId: parsedVehicle.userId,
        participants: [auth.currentUser.uid, parsedVehicle.userId],
        title: "Vehicle Alert",
        message,
        timestamp: Timestamp.now(),
        status: "sent",
      });

      setCustomMessage("");
      alert("Notification sent.");
      router.replace("/"); // Go back to main screen
    } catch (err) {
      console.error("Push error:", err);
      alert("Failed to send notification.");
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <Card.Title title="Notify Vehicle Owner" />
          <Card.Content>
            <Text variant="titleMedium">
              {parsedVehicle.brand} {parsedVehicle.model} ({parsedVehicle.year})
            </Text>
            <Text>Plate: {parsedVehicle.plate}</Text>
            <Text>Color: {parsedVehicle.color}</Text>

            <Text style={styles.subheading}>Reason for notification:</Text>
            <RadioButton.Group
              onValueChange={(value) => setSelectedReason(value)}
              value={selectedReason}
            >
              {GENERAL_MESSAGES.map((item) => (
                <RadioButton.Item
                  key={item.value}
                  label={item.label}
                  value={item.value}
                  mode="android"
                />
              ))}
            </RadioButton.Group>

            {selectedReason === "custom" && (
              <TextInput
                label="Your Message"
                value={customMessage}
                onChangeText={setCustomMessage}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.input}
              />
            )}

            <Button
              mode="contained"
              onPress={handleConfirmSend}
              loading={sending}
              disabled={
                sending ||
                (selectedReason === "custom" && !customMessage.trim())
              }
              style={styles.button}
            >
              Confirm & Send
            </Button>
          </Card.Content>
        </Card>

        <Portal>
          <Dialog visible={confirmVisible} onDismiss={handleCancel}>
            <Dialog.Title>Confirm Notification</Dialog.Title>
            <Dialog.Content>
              <Paragraph>{getMessageText()}</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={handleCancel}>Cancel</Button>
              <Button onPress={handleSend}>Send</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    marginBottom: 20,
  },
  subheading: {
    marginTop: 20,
    fontWeight: "bold",
  },
  input: {
    marginTop: 10,
    marginBottom: 20,
  },
  button: {
    marginTop: 20,
  },
});
