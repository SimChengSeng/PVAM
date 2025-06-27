import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import React from "react";
import { useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { setLocalStorage } from "../../service/Storage";

const bgUrl =
  "https://firebasestorage.googleapis.com/v0/b/fyp-project-26d3b.firebasestorage.app/o/image%2FwelcomeBg.jpg?alt=media&token=2530dd9a-b769-4d3d-8193-6220b6cbe960";

export default function Welcome() {
  const theme = useTheme();
  const router = useRouter();

  const handleContinue = async () => {
    await setLocalStorage("hasSeenWelcome", "true"); // <-- use the same key and value as in index.js
    router.push("/(auth)/LoginScreen");
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.primary }}>
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={[styles.contentBox, { color: theme.colors.Primary }]}>
          <Text style={[styles.title, { color: theme.colors.onPrimary }]}>
            Welcome
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.onPrimary }]}>
            Stay on Track, Keep your vehicle condition good!
          </Text>
          <Text style={[styles.body, { color: theme.colors.onPrimary }]}>
            Record maintenance history, make reminders for your next service.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.onPrimary }]}
            onPress={handleContinue}
            activeOpacity={0.85}
          >
            <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Image
        source={{ uri: bgUrl }}
        style={styles.bottomImage}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  contentBox: {
    width: "100%",
    borderRadius: 16,
    padding: 32,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  body: {
    fontSize: 16,
    marginBottom: 32,
    textAlign: "center",
    opacity: 0.9,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 99,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1,
  },
  bottomImage: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "38%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: "hidden",
    zIndex: 0,
  },
});
