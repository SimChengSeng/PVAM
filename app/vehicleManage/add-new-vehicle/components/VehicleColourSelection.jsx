import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import React from "react";

export default function VehicleColourSelection({ onSelectType }) {
  const vehicleColour = [
    { label: "Black", colorCode: "#000000" },
    { label: "White", colorCode: "#FFFFFF" },
    { label: "Silver", colorCode: "#C0C0C0" },
    { label: "Red", colorCode: "#FF0000" },
    { label: "Blue", colorCode: "#0000FF" },
    { label: "Gray", colorCode: "#808080" },
    { label: "Green", colorCode: "#008000" },
    { label: "Yellow", colorCode: "#FFFF00" },
    { label: "Orange", colorCode: "#FFA500" },
    { label: "Brown", colorCode: "#8B4513" },
    { label: "Purple", colorCode: "#800080" },
    { label: "Gold", colorCode: "#FFD700" },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Choose Vehicle Colour</Text>
      <Text style={styles.subtitle}>
        Select the color of the vehicle you're adding
      </Text>
      <View style={styles.grid}>
        {vehicleColour.map((type) => (
          <Pressable
            key={type.label}
            style={styles.card}
            onPress={() => onSelectType(type.label.toLowerCase())}
          >
            <View
              style={[styles.colorCircle, { backgroundColor: type.colorCode }]}
            />
            <Text style={styles.label}>{type.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  card: {
    width: "47%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  colorCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textTransform: "capitalize",
  },
});
