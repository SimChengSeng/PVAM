import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import {
  Card,
  Text,
  Button,
  TextInput,
  Dialog,
  Portal,
  Snackbar,
  useTheme,
  Provider,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, collection, addDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "../../../config/FirebaseConfig";
import axios from "axios";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const GENERAL_MESSAGES = [
  {
    label: "vehicle alarm is going off",
    value: "alarm",
    icon: "alarm-light",
  },
  {
    label: "vehicle lights are on",
    value: "lights",
    icon: "car-light-alert",
  },
  {
    label: "Blocking my vehicle",
    value: "blocking",
    icon: "block-helper",
  },
  { label: "Door/trunk is open", value: "open", icon: "car-door" },
  {
    label: "Vehicle is damaged",
    value: "damaged",
    icon: "alert-circle-outline",
  },
  {
    label: "Vehicle fuel tank cap is open",
    value: "fuel_cap_open",
    icon: "gas-station",
  },
  { label: "Vehicle tire is flat", value: "flat", icon: "car-tire-alert" },
  {
    label: "Custom message",
    value: "custom",
    icon: "message-alert",
  },
];

export default function NotifyForm() {
  const { vehicle } = useLocalSearchParams();
  const parsedVehicle = JSON.parse(vehicle);
  const router = useRouter();
  const theme = useTheme();

  const [selectedReason, setSelectedReason] = useState("alarm");
  const [customMessage, setCustomMessage] = useState("");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sending, setSending] = useState(false);
  const [snackVisible, setSnackVisible] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");

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
        setSnackMessage("Owner cannot be contacted.");
        setSnackVisible(true);
        setSending(false);
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
      setSnackMessage("Notification sent.");
      setSnackVisible(true);
      setTimeout(() => router.replace("/"), 1200); // Go back to main screen after short delay
    } catch (err) {
      console.error("Push error:", err);
      setSnackMessage("Failed to send notification.");
      setSnackVisible(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <Provider>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.container,
            { backgroundColor: theme.colors.background },
          ]}
        >
          <Card
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            <Card.Title
              title="Notify Vehicle Owner"
              titleStyle={{
                fontSize: 20,
                color: theme.colors.primary,
                fontWeight: "bold",
              }}
              subtitle="Select the reason for notification"
            />
            <Card.Content>
              <Text
                style={[styles.vehicleTitle, { color: theme.colors.primary }]}
              >
                {parsedVehicle.plateNumber ?? parsedVehicle.plate}
              </Text>
              <Text style={{ color: theme.colors.onSurface }}>
                Model: {parsedVehicle.brand} {parsedVehicle.model} (
                {parsedVehicle.year})
              </Text>
              <Text style={{ color: theme.colors.onSurface }}>
                Color: {parsedVehicle.color}
              </Text>

              <Card
                style={[
                  styles.reasonCard,
                  { backgroundColor: theme.colors.surface },
                ]}
              >
                <Text
                  style={[
                    styles.subheading,
                    { color: theme.colors.primary, marginTop: 0 },
                  ]}
                >
                  Reason for notification:
                </Text>
                <View style={{ gap: 8 }}>
                  {GENERAL_MESSAGES.map((item) => {
                    const selected = selectedReason === item.value;
                    return (
                      <Pressable
                        key={item.value}
                        onPress={() => setSelectedReason(item.value)}
                        style={[
                          styles.reasonItem,
                          {
                            borderColor: selected
                              ? theme.colors.primary
                              : theme.colors.outlineVariant,
                            backgroundColor: selected
                              ? theme.colors.primary + "15"
                              : theme.colors.surface,
                          },
                        ]}
                      >
                        <Ionicons
                          name={
                            selected ? "radio-button-on" : "radio-button-off"
                          }
                          size={20}
                          color={
                            selected
                              ? theme.colors.primary
                              : theme.colors.outlineVariant
                          }
                          style={{ marginRight: 12 }}
                        />
                        <MaterialCommunityIcons
                          name={item.icon}
                          size={22}
                          color={
                            selected
                              ? theme.colors.primary
                              : theme.colors.outlineVariant
                          }
                          style={{ marginRight: 10 }}
                        />

                        <Text
                          style={{
                            color: selected
                              ? theme.colors.primary
                              : theme.colors.onSurface,
                            fontWeight: selected ? "bold" : "normal",
                            fontSize: 15,
                            flex: 1,
                          }}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Card>

              {selectedReason === "custom" && (
                <TextInput
                  label="Your Message"
                  value={customMessage}
                  onChangeText={setCustomMessage}
                  mode="outlined"
                  multiline
                  numberOfLines={4}
                  style={[
                    styles.input,
                    { backgroundColor: theme.colors.surface },
                  ]}
                  theme={{
                    colors: {
                      primary: theme.colors.primary,
                      text: theme.colors.onSurface,
                      placeholder: theme.colors.onSurfaceVariant,
                      background: theme.colors.surface,
                    },
                  }}
                  textColor={theme.colors.onSurface}
                  placeholderTextColor={theme.colors.onSurfaceVariant}
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
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary },
                ]}
                textColor={theme.colors.onPrimary}
              >
                Confirm & Send
              </Button>
            </Card.Content>
          </Card>

          <Portal>
            <Dialog
              visible={confirmVisible}
              onDismiss={handleCancel}
              style={{ backgroundColor: theme.colors.surface }}
            >
              <Dialog.Title style={{ color: theme.colors.primary }}>
                Confirm Notification
              </Dialog.Title>
              <Dialog.Content>
                <Text style={{ color: theme.colors.onSurface }}>
                  {getMessageText()}
                </Text>
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={handleCancel} textColor={theme.colors.primary}>
                  Cancel
                </Button>
                <Button onPress={handleSend} textColor={theme.colors.primary}>
                  Send
                </Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>
        </ScrollView>
        <Snackbar
          visible={snackVisible}
          onDismiss={() => setSnackVisible(false)}
          duration={3000}
          style={{ backgroundColor: theme.colors.surface }}
          action={{
            label: "Close",
            onPress: () => setSnackVisible(false),
            textColor: theme.colors.primary,
          }}
        >
          <Text style={{ color: theme.colors.onSurface }}>{snackMessage}</Text>
        </Snackbar>
      </KeyboardAvoidingView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  vehicleTitle: {
    fontWeight: "bold",
    fontSize: 20,
    marginBottom: 4,
  },
  subheading: {
    marginTop: 20,
    fontWeight: "bold",
    fontSize: 15,
    marginBottom: 8,
  },
  input: {
    marginTop: 10,
    marginBottom: 20,
    borderRadius: 8,
  },
  button: {
    marginTop: 20,
    borderRadius: 8,
  },
  reasonCard: {
    borderRadius: 12,
    padding: 12,
    elevation: 0,
    marginBottom: 18,
    marginTop: 10,
  },
  reasonItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 0,
    backgroundColor: "#fff",
  },
});
