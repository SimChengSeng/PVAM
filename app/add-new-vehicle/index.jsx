import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import VehicleTypeSelection from "../../components/VehicleTypeSelection";
import VehicleColourSelection from "../../components/VehicleColourSelection";
import AddVehicleForm from "../../components/AddVehicleForm";

export default function AddNewVehicle() {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  // Determine current step
  const currentStep = !selectedType ? 1 : !selectedColor ? 2 : 3;

  return (
    <View style={styles.container}>
      <StepIndicator currentStep={currentStep} />

      {currentStep === 1 && (
        <VehicleTypeSelection onSelectType={setSelectedType} />
      )}
      {currentStep === 2 && (
        <VehicleColourSelection onSelectType={setSelectedColor} />
      )}
      {currentStep === 3 && (
        <AddVehicleForm
          vehicleType={selectedType}
          vehicleColor={selectedColor}
        />
      )}
    </View>
  );
}

// 🎯 Simple Step Indicator Component
function StepIndicator({ currentStep }) {
  const steps = ["Type", "Colour", "Details"];

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
});
