import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useTheme } from "react-native-paper";

const BrandSelectionScreen = ({ onSelectBrand, brands = [], vehicleType }) => {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        Choose Brand
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Select the brand of {vehicleType} you want to add
      </Text>
      <View style={styles.grid}>
        {brands.map(({ brand, models }) => (
          <TouchableOpacity
            key={brand}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant || "#e0e0e0",
                shadowColor: theme.dark
                  ? theme.colors.shadow || "#000"
                  : "#000",
              },
            ]}
            activeOpacity={0.8}
            onPress={() => onSelectBrand(brand, models)}
          >
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>
              {brand}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  card: {
    width: 120,
    height: 120,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    elevation: 4,
    margin: 8,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    marginTop: 5,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
});

export default BrandSelectionScreen;
