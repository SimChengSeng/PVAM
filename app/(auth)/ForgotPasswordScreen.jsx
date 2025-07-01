import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ToastAndroid,
} from "react-native";
import { Text, TextInput, useTheme, Button, Card } from "react-native-paper";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../config/FirebaseConfig";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, getThemedStyles } from "../../styles/globalStyles";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const { colors } = useTheme();
  const router = useRouter();

  const showToast = (msg) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      alert(msg);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      showToast("Please enter a valid email.");

      return;
    }

    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSnackbarMsg("✅ Reset link sent! Check your inbox.");
      setSuccessVisible(true);
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        setSnackbarMsg("No user found with this email.");
      } else {
        setSnackbarMsg("Something went wrong. Try again later.");
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Card style={[globalStyles.card, getThemedStyles.card]}>
        <View>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginBottom: 16,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
            <Text
              style={[
                styles.backLink,
                { color: colors.primary, marginLeft: 6 },
              ]}
            >
              Back to Login
            </Text>
          </TouchableOpacity>

          <Text style={[styles.title, { color: colors.primary }]}>
            Forgot Password
          </Text>

          <Text variant="bodyMedium" style={styles.subtitle}>
            Get a password reset email
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                borderColor: colors.primary,
                backgroundColor: colors.surface,
                color: colors.onSurface,
              },
            ]}
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
          />

          <Button
            mode="contained"
            buttonColor={colors.primary}
            textColor={colors.onPrimary}
            onPress={handleForgotPassword}
            style={{ marginTop: 16 }}
          >
            Send Reset Link
          </Button>
        </View>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    padding: 25,
    borderRadius: 12,
    elevation: 6,
  },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    marginBottom: 6,
    fontWeight: "500",
  },
  input: {
    marginBottom: 12,
  },
  backLink: {
    fontSize: 14,
    fontWeight: "500",
  },
  subtitle: {
    textAlign: "center",
    color: "#64748B",
    marginBottom: 20,
  },
});
