import { View, Text, StyleSheet } from "react-native";
import React from "react";

export default function AddNew() {
  return (
    <View style={styles.container}>
      <Text>AddNew</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#1e1e2f",
  },
});
