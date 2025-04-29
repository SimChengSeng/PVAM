import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import { auth } from "../../config/FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import { setLocalStorage } from "../../service/Storage";

export default function LoginScreen() {
  const router = useRouter();
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

        console.log("Login successful:", user);
        ToastAndroid.show("Welcome back!", ToastAndroid.SHORT);

        router.replace("/(tabs)"); // Navigate only after successful login
      })
      .catch((error) => {
        const errorCode = error.code;
        console.log("Login error:", errorCode);

        if (errorCode === "auth/invalid-email") {
          ToastAndroid.show("Invalid email format", ToastAndroid.SHORT);
        } else if (errorCode === "auth/user-not-found") {
          ToastAndroid.show("User not found", ToastAndroid.SHORT);
        } else if (errorCode === "auth/wrong-password") {
          ToastAndroid.show("Incorrect password", ToastAndroid.SHORT);
        } else {
          ToastAndroid.show("Login failed", ToastAndroid.SHORT);
        }
      });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Text style={styles.carIcon}>🚗</Text>
        </View>
        <Text style={styles.title}>Vehicle Assistant</Text>
        <Text style={styles.subtitle}>Manage your vehicles with ease</Text>

        <TextInput
          style={styles.input}
          placeholder="name@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity onPress={handleLogin} style={styles.submitButton}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/RegisterScreen")}
          style={{ marginTop: 10 }}
        >
          <Text style={styles.link}>Don't have an account? Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/ForgotPasswordScreen")}
          style={{ marginTop: 10 }}
        >
          <Text style={styles.link}>Forgot Password?</Text>
        </TouchableOpacity>

        <Text style={styles.termsText}>
          By continuing, you agree to our{" "}
          <Text style={styles.link}>Terms of Service</Text> and{" "}
          <Text style={styles.link}>Privacy Policy</Text>.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 25,
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
  carIcon: { fontSize: 28 },
  title: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 14,
    color: "#64748B",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  submitButton: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "#fff", fontWeight: "bold" },
  termsText: {
    fontSize: 12,
    textAlign: "center",
    color: "#64748B",
    marginTop: 16,
  },
  link: {
    textDecorationLine: "underline",
    color: "#0F172A",
    textAlign: "center",
  },
});
