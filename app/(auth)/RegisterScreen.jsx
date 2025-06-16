import React, { useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { auth, db } from "../../config/FirebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  TextInput,
  Button,
  Text,
  HelperText,
  useTheme,
  Card,
} from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { globalStyles, getThemedStyles } from "../../styles/globalStyles";

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const customUserId = Date.now().toString();

  const handleRegister = () => {
    setError("");
    if (!name || !email || !password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;
        try {
          await updateProfile(user, { displayName: name });
          await setDoc(doc(db, "users", user.uid), {
            customUserId,
            name,
            email,
            phone: "",
            profileImage: "",
            role: "owner",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await sendEmailVerification(user);
          router.replace("/(auth)/LoginScreen");
        } catch (err) {
          setError("Something went wrong");
        } finally {
          setLoading(false);
        }
      })
      .catch((error) => {
        const errorCode = error.code;
        if (errorCode === "auth/email-already-in-use") {
          setError("Email already exists");
        } else if (errorCode === "auth/invalid-email") {
          setError("Invalid email format");
        } else if (errorCode === "auth/weak-password") {
          setError("Password should be at least 6 characters");
        } else {
          setError("Registration failed");
        }
        setLoading(false);
      });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Card style={[globalStyles.card, getThemedStyles.card]}>
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
            style={[styles.backLink, { color: colors.primary, marginLeft: 6 }]}
          >
            Back to Login
          </Text>
        </TouchableOpacity>
        <View style={styles.iconCircle}>
          <Text style={styles.carIcon}>🚗</Text>
        </View>
        <Text
          variant="titleLarge"
          style={[styles.title, { color: colors.primary }]}
        >
          Create an Account
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Join Vehicle Assistant today
        </Text>

        <TextInput
          label="User Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          style={styles.input}
          mode="outlined"
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword((prev) => !prev)}
            />
          }
        />
        <TextInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
          style={styles.input}
          mode="outlined"
          right={
            <TextInput.Icon
              icon={showPassword ? "eye-off" : "eye"}
              onPress={() => setShowPassword((prev) => !prev)}
            />
          }
        />

        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>

        <Button
          mode="contained"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.submitButton}
        >
          Register
        </Button>

        <Button
          mode="text"
          onPress={() => router.back()}
          style={{ marginTop: 10 }}
        >
          Already have an account? Sign In
        </Button>
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
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 10,
  },
});
