import { View, Text, Pressable, StyleSheet } from "react-native";
import React from "react";
import FastImage from "react-native-fast-image";
import { useTheme } from "react-native-paper";

// Firebase image URLs
const vehicleTypes = [
  {
    label: "Car",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/fyp-project-26d3b.firebasestorage.app/o/vehicle%20types%2Fcar.png?alt=media&token=e6a5bcb6-b865-483a-babd-7e40bd58332c",
  },
  {
    label: "Motorcycle",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/fyp-project-26d3b.firebasestorage.app/o/vehicle%20types%2Fmotorcycle.png?alt=media&token=8117f1a6-8330-4915-97c7-65fd69448e61",
  },
  {
    label: "Truck",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/fyp-project-26d3b.firebasestorage.app/o/vehicle%20types%2Ftruck.png?alt=media&token=18305507-0b7a-45ab-9bbe-61245c2a9810",
  },
  {
    label: "Van",
    imageUrl:
      "https://firebasestorage.googleapis.com/v0/b/fyp-project-26d3b.firebasestorage.app/o/vehicle%20types%2Fvan.png?alt=media&token=c3e75d69-8632-44aa-8e1b-e2e2af3f7052",
  },
];

export default function VehicleTypeSelection({ onSelectType }) {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        Choose Vehicle Type
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Select the type of vehicle you want to add
      </Text>
      <View style={styles.grid}>
        {vehicleTypes.map((type) => (
          <Pressable
            key={type.label}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                shadowColor: theme.dark
                  ? theme.colors.shadow || "#000"
                  : "#000",
                borderColor: theme.colors.outlineVariant || "#e0e0e0",
              },
            ]}
            android_ripple={{
              color: theme.colors.primary + "22",
              borderless: false,
            }}
            onPress={() => onSelectType(type.label.toLowerCase())}
          >
            <FastImage
              style={styles.image}
              source={{
                uri: type.imageUrl,
                priority: FastImage.priority.normal,
              }}
              resizeMode={FastImage.resizeMode.contain}
              onError={(e) => {
                console.warn(
                  `Failed to load image for ${type.label}`,
                  e.nativeEvent
                );
              }}
            />
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>
              {type.label}
            </Text>
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
    flex: 1,
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
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
  },
  image: {
    width: 120,
    height: 120,
  },
  label: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
});
