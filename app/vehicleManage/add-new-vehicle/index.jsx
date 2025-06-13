import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  BackHandler,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../config/FirebaseConfig";
import VehicleTypeSelection from "./components/VehicleTypeSelection";
import VehicleColourSelection from "./components/VehicleColourSelection";
import AddVehicleForm from "./components/AddVehicleForm";
import VehicleCategorySelection from "./components/VehicleCategorySelection";
import VehicleBrandSelection from "./components/VehicleBrandSelection";

export default function AddNewVehicle() {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [brandModels, setBrandModels] = useState([]); // loaded from BrandSelection
  const [brandList, setBrandList] = useState([]);
  const [brandListCache, setBrandListCache] = useState({});

  const currentStep = !selectedType
    ? 1
    : !selectedColor
    ? 2
    : !selectedBrand
    ? 3
    : !selectedModel
    ? 4
    : 5;

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (currentStep === 1) return false;
        goBack();
        return true;
      };
      BackHandler.addEventListener("hardwareBackPress", onBackPress);
      return () =>
        BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, [currentStep])
  );

  const goBack = () => {
    if (currentStep === 5) setSelectedModel(null);
    else if (currentStep === 4) setSelectedBrand(null);
    else if (currentStep === 3) setSelectedColor(null);
    else if (currentStep === 2) setSelectedType(null);
  };

  // Fetch brands when selectedType changes
  useEffect(() => {
    if (!selectedType) return;

    // Only fetch if not already cached
    if (brandListCache[selectedType]) {
      setBrandList(brandListCache[selectedType]);
      return;
    }

    const fetchBrands = async () => {
      try {
        const brandRef = collection(
          db,
          `maintenanceMeta/${selectedType}/brands`
        );
        const snapshot = await getDocs(brandRef);
        const list = snapshot.docs.map((doc) => ({
          brand: doc.id,
          models: doc.data().models,
        }));
        setBrandList(list);
        setBrandListCache((prev) => ({ ...prev, [selectedType]: list }));
      } catch (error) {
        console.error("Error fetching brand metadata:", error);
      }
    };

    fetchBrands();
  }, [selectedType]);

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <StepIndicator currentStep={currentStep} />

          {currentStep === 1 && (
            <VehicleTypeSelection onSelectType={setSelectedType} />
          )}
          {currentStep === 2 && (
            <VehicleColourSelection onSelectType={setSelectedColor} />
          )}
          {currentStep === 3 && (
            <VehicleBrandSelection
              brands={brandList}
              onSelectBrand={(brand, models) => {
                setSelectedBrand(brand);
                setBrandModels(models);
              }}
              vehicleType={selectedType}
            />
          )}
          {currentStep === 4 && (
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text
                style={{ fontSize: 20, fontWeight: "600", marginBottom: 16 }}
              >
                Select Model
              </Text>
              {brandModels.map((model) => (
                <Pressable
                  key={model.name}
                  style={styles.card}
                  onPress={() => {
                    setSelectedModel(model.name);
                    setSelectedCategory(model.category);
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{model.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {currentStep === 5 && (
            <AddVehicleForm
              vehicleType={selectedType}
              vehicleColor={selectedColor}
              vehicleCategory={selectedCategory}
              vehicleBrand={selectedBrand}
              vehicleModel={selectedModel}
            />
          )}
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

function StepIndicator({ currentStep }) {
  const steps = ["Type", "Colour", "Brand", "Model", "Details"];

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
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
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
  card: {
    width: "100%",
    padding: 16,
    marginVertical: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
});
