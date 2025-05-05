import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import Colors from "../../constant/Colors";
import { useRouter } from "expo-router";
import { setLocalStorage } from "../../service/Storage";

export default function Welcome() {
  const router = useRouter();

  const handleContinue = async () => {
    await setLocalStorage("firstTime", true);
    router.push("/(auth)/LoginScreen");
  };

  return (
    <View
      style={{ padding: 25, backgroundColor: Colors.PRIMARY, height: "50%" }}
    >
      <Text
        style={{
          fontSize: 30,
          fontWeight: "bold",
          color: "white",
          textAlign: "center",
        }}
      >
        Welcome, Stay on Track, Keep your vehicle condition good!
      </Text>
      <Text
        style={{
          fontSize: 17,
          color: "white",
          textAlign: "center",
          marginTop: 20,
        }}
      >
        Record maintenance history, Make reminder for next service.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text
          style={{ fontSize: 16, color: Colors.PRIMARY, textAlign: "center" }}
        >
          Continue
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 99,
    marginTop: 25,
  },
});
