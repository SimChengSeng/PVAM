import { View, Text, Pressable, StyleSheet } from "react-native";
import React from "react";
import { Car, Truck, Bike } from "lucide-react-native";

export default function VehicleCategorySelection({ onSelectType }) {
  const vehicleCategorys = [
    { label: "MPV", icon: <Car size={40} color="#000" /> },
    { label: "Motorcycle", icon: <Car size={40} color="#000" /> },
    { label: "Truck", icon: <Car size={40} color="#000" /> },
    { label: "Others", icon: <Car size={40} color="#000" /> },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Vehicle Category</Text>
      <Text style={styles.subtitle}>
        Select the Category of vehicle you want to add
      </Text>
      <View style={styles.grid}>
        {vehicleCategorys.map((Category) => (
          <Pressable
            key={Category.label}
            style={styles.card}
            onPress={() => onSelectType(Category.label.toLowerCase())}
          >
            {Category.icon}
            <Text style={styles.label}>{Category.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
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
  label: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
