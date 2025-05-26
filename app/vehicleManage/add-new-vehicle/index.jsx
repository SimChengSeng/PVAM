import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  BackHandler,
  Alert,
} from "react-native";
import VehicleTypeSelection from "./components/VehicleTypeSelection";
import VehicleColourSelection from "./components/VehicleColourSelection";
import AddVehicleForm from "./components/AddVehicleForm";
import VehicleCategorySelection from "./components/VehicleCategorySelection";
import VehicleBrandSelection from "./components/VehicleBrandSelection";
import { Provider as PaperProvider } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";

export default function AddNewVehicle() {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const currentStep = !selectedType
    ? 1
    : !selectedColor
    ? 2
    : !selectedBrand
    ? 3
    : !selectedCategory
    ? 4
    : 5;

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (currentStep === 1) {
          return false;
        } else {
          goBack();
          return true;
        }
      };
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () => {
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
      };
    }, [currentStep])
  );

  const goBack = () => {
    if (currentStep === 5) {
      setSelectedCategory(null); // Go back to category selection
    } else if (currentStep === 4) {
      setSelectedBrand(null); // Go back to brand selection
    } else if (currentStep === 3) {
      setSelectedColor(null); // Go back to color selection
    } else if (currentStep === 2) {
      setSelectedType(null); // Go back to type selection
    }
  };

  return (
    <PaperProvider>
      <View style={styles.container}>
        <StepIndicator currentStep={currentStep} />

        {currentStep === 1 && (
          <VehicleTypeSelection onSelectType={setSelectedType} />
        )}
        {currentStep === 2 && (
          <VehicleColourSelection onSelectType={setSelectedColor} />
        )}
        {currentStep === 3 && (
          <VehicleBrandSelection onSelectBrand={setSelectedBrand} />
        )}
        {currentStep === 4 && (
          <VehicleCategorySelection
            onSelectType={setSelectedCategory}
            vehicleType={selectedType}
            vehicleBrand={selectedBrand}
          />
        )}
        {currentStep === 5 && (
          <AddVehicleForm
            vehicleType={selectedType}
            vehicleColor={selectedColor}
            vehicleCategory={selectedCategory}
            vehicleBrand={selectedBrand}
          />
        )}
      </View>
    </PaperProvider>
  );
}

function StepIndicator({ currentStep }) {
  const steps = ["Type", "Colour", "Category", "Brand", "Details"];

  return (
    <View style={styles.stepContainer}>
      {steps.map((label, index) => {
        const stepNum = index + 1;
        const isActive = currentStep === stepNum;
        const isCompleted = currentStep > stepNum;

        return (
          <View key={label} style={styles.stepItem}>
            <View
              style={[
                styles.circle,
                isActive && styles.activeCircle,
                isCompleted && styles.completedCircle,
              ]}
            >
              <Text style={styles.circleText}>{stepNum}</Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                (isActive || isCompleted) && styles.activeLabel,
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  stepContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  activeCircle: {
    borderColor: "#4a90e2",
  },
  completedCircle: {
    backgroundColor: "#4a90e2",
    borderColor: "#4a90e2",
  },
  circleText: {
    fontWeight: "bold",
    color: "#333",
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 12,
    color: "#999",
  },
  activeLabel: {
    color: "#4a90e2",
    fontWeight: "600",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  backText: {
    fontSize: 16,
    color: "#333",
  },
});
