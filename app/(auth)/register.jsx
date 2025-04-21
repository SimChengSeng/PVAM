import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ToastAndroid,
  Alert,
} from "react-native";
import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "./../../config/FirebaseConfig";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleRegister = () => {
    if (!name || !email || !password || !confirmPassword) {
      ToastAndroid.show("Please fill all fields", ToastAndroid.SHORT);
      Alert.alert("Please enter all the required fields");
      return;
    }

    if (password !== confirmPassword) {
      ToastAndroid.show("Passwords do not match", ToastAndroid.SHORT);
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        try {
          const user = userCredential.user;

          await updateProfile(user, {
            displayName: name,
          });

          await sendEmailVerification(user);

          // await setLocalStorage("userDetail", user);

          console.log("User registered:", user);
          ToastAndroid.show("Registration successful", ToastAndroid.SHORT);
          router.replace("(tabs)");
        } catch (err) {
          console.log("Post-registration error:", err);
          ToastAndroid.show("Something went wrong", ToastAndroid.SHORT);
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        console.log("Register error:", errorCode);

        if (errorCode === "auth/email-already-in-use") {
          ToastAndroid.show("Email already exists", ToastAndroid.SHORT);
        } else if (errorCode === "auth/invalid-email") {
          ToastAndroid.show("Invalid email format", ToastAndroid.SHORT);
        } else if (errorCode === "auth/weak-password") {
          ToastAndroid.show(
            "Password should be at least 6 characters",
            ToastAndroid.SHORT
          );
        } else {
          ToastAndroid.show("Registration failed", ToastAndroid.SHORT);
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
        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.subtitle}>Join Vehicle Assistant today</Text>

        <TextInput
          style={styles.input}
          placeholder="User Name"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="name@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />

        <TouchableOpacity onPress={handleRegister} style={styles.submitButton}>
          <Text style={styles.buttonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginTop: 10 }}
        >
          <Text style={styles.link}>Already have an account? Sign In</Text>
        </TouchableOpacity>
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
  link: {
    textDecorationLine: "underline",
    color: "#0F172A",
    textAlign: "center",
  },
});
