import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
} from "react-native";
import { useTheme } from "react-native-paper";
import { useNavigation } from "@react-navigation/native"; // <-- Add this import

const vehicleCategories = [
  { label: "Sedan", value: "sedan" },
  { label: "SUV", value: "suv" },
  { label: "Coupe", value: "coupe" },
  { label: "Cabriolet", value: "cabriolet" },
  { label: "Hatchback", value: "hatchback" },
  { label: "CUV", value: "cuv" },
  { label: "Mirco", value: "mirco" },
  { label: "MPV", value: "mpv" },
  { label: "Pickup", value: "pickup" },
  { label: "Supercar", value: "supercar" },
  { label: "Sport", value: "sport" },
  { label: "Chopper", value: "chopper" },
  { label: "Cruiser", value: "cruiser" },
  { label: "Offroad", value: "offroad" },
  { label: "Scooter", value: "scooter" },
  { label: "Touring", value: "touring" },
  { label: "Underbone", value: "underbone" },
  { label: "Truck", value: "truck" },
  { label: "Van", value: "van" },
];

const BrandSelectionScreen = ({ onSelectBrand, brands = [], vehicleType, vehicleColor }) => {
  const theme = useTheme();
  const navigation = useNavigation(); // <-- Use this hook
  const [modalVisible, setModalVisible] = useState(false);
  const [customBrand, setCustomBrand] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [customCategory, setCustomCategory] = useState(""); // <-- Add this state

  // When user adds custom, go directly to AddVehicleForm with all data
  const handleAddCustom = () => {
    if (customBrand.trim() && customModel.trim() && customCategory) {
      setModalVisible(false);
      setCustomBrand("");
      setCustomModel("");
      setCustomCategory("");
      // Call onSelectBrand and also set model directly in parent
      if (onSelectBrand) {
        onSelectBrand(
          customBrand.trim(),
          [{ name: customModel.trim(), category: customCategory, isCustom: true }]
        );
      }
      // Optionally: If you want to also set the model in parent, you can pass a callback or handle in parent
    }
  };

  // When user selects a brand, go to model selection as usual
  const handleSelectBrand = (brand, models) => {
    if (onSelectBrand) {
      onSelectBrand(brand, models);
    }
  };

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
            onPress={() => handleSelectBrand(brand, models)}
          >
            <Text style={[styles.label, { color: theme.colors.onSurface }]}>
              {brand}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        style={{
          marginTop: 24,
          padding: 14,
          borderRadius: 8,
          backgroundColor: theme.colors.primary,
          alignItems: "center",
        }}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: theme.colors.onPrimary, fontWeight: "bold" }}>
          Can't find your brand/model? Add custom
        </Text>
      </TouchableOpacity>
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 12, color: theme.colors.primary }}>
              Add Custom Brand & Model
            </Text>
            <TextInput
              placeholder="Brand"
              value={customBrand}
              onChangeText={setCustomBrand}
              style={[styles.input, { borderColor: theme.colors.outline }]}
              placeholderTextColor={theme.colors.outline}
            />
            <TextInput
              placeholder="Model"
              value={customModel}
              onChangeText={setCustomModel}
              style={[styles.input, { borderColor: theme.colors.outline }]}
              placeholderTextColor={theme.colors.outline}
            />
            {/* Category selection without Picker */}
            <View style={{ marginBottom: 12 }}>
              <Text style={{ marginBottom: 6, color: theme.colors.onSurfaceVariant }}>
                Select Category
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {vehicleCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: customCategory === cat.value ? theme.colors.primary : theme.colors.outline,
                      backgroundColor: customCategory === cat.value ? theme.colors.primary : "transparent",
                      marginRight: 8,
                      marginBottom: 8,
                    }}
                    onPress={() => setCustomCategory(cat.value)}
                  >
                    <Text style={{
                      color: customCategory === cat.value ? theme.colors.onPrimary : theme.colors.onSurface
                    }}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.colors.secondary }]}
                onPress={() => {
                  setModalVisible(false);
                  setCustomBrand("");
                  setCustomModel("");
                  setCustomCategory("");
                }}
              >
                <Text style={{ color: theme.colors.onSecondary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {
                    backgroundColor: theme.colors.primary,
                    marginLeft: 12,
                    opacity: customBrand.trim() && customModel.trim() && customCategory ? 1 : 0.5,
                  },
                ]}
                onPress={handleAddCustom}
                disabled={!customBrand.trim() || !customModel.trim() || !customCategory}
              >
                <Text style={{ color: theme.colors.onPrimary }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    borderRadius: 16,
    padding: 24,
    elevation: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    fontSize: 16,
    color: "#222",
    backgroundColor: "#fff",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
});

export default BrandSelectionScreen;
