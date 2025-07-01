import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  Image,
} from "react-native";
import { Text, TextInput, Button, useTheme, Card } from "react-native-paper";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/FirebaseConfig";
import { setLocalStorage } from "../../service/Storage";
import { globalStyles, getThemedStyles } from "../../styles/globalStyles";
import {
  rescheduleRemindersOnLogin,
  rescheduleWeeklyRemindersOnLogin,
} from "../../utils/notifications/rescheduleRemindersOnLogin";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (!email || !password) {
      ToastAndroid.show("Please enter email and password", ToastAndroid.SHORT);
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        await setLocalStorage("userDetail", user);
        ToastAndroid.show("Welcome back!", ToastAndroid.SHORT);
        router.replace("/");

        // Reschedule reminders after login
        await rescheduleRemindersOnLogin(auth.currentUser.email);
        await rescheduleWeeklyRemindersOnLogin(auth.currentUser.uid);
      })
      .catch((error) => {
        const msg =
          error.code === "auth/invalid-email"
            ? "Invalid email format"
            : error.code === "auth/user-not-found"
            ? "User not found"
            : error.code === "auth/wrong-password"
            ? "Incorrect password"
            : "Login failed";
        ToastAndroid.show(msg, ToastAndroid.SHORT);
      });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Card style={[globalStyles.card, getThemedStyles.card]}>
        <Card.Content>
          <View style={styles.iconCircle}>
            <Image
              source={require("../../assets/images/splash-icon.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text
            variant="titleLarge"
            style={[styles.title, { color: colors.primary }]}
          >
            Vehicle Assistant
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Manage your vehicles with ease
          </Text>

          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            mode="outlined"
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.submitButton}
          >
            Sign In
          </Button>

          <Button
            mode="text"
            onPress={() => router.push("/(auth)/RegisterScreen")}
          >
            Don't have an account? Register
          </Button>

          <Button
            mode="text"
            onPress={() => router.push("/(auth)/ForgotPasswordScreen")}
          >
            Forgot Password?
          </Button>
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    padding: 0,
    borderRadius: 12,
    elevation: 6,
  },
  iconCircle: {
    backgroundColor: "#E2E8F0",
    padding: 16,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 16,
  },
  logo: {
    width: 48,
    height: 48,
  },
  title: {
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    color: "#64748B",
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 10,
    marginBottom: 10,
  },
});
