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
import { Provider as PaperProvider, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../config/FirebaseConfig";
import VehicleTypeSelection from "./components/VehicleTypeSelection";
import VehicleColourSelection from "./components/VehicleColourSelection";
import AddVehicleForm from "./components/AddVehicleForm";
import VehicleBrandSelection from "./components/VehicleBrandSelection";

export default function AddNewVehicle() {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedModel, setSelectedModel] = useState(null);
  const [brandModels, setBrandModels] = useState([]);
  const [brandList, setBrandList] = useState([]);
  const [brandListCache, setBrandListCache] = useState({});

  const theme = useTheme();

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
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.container}>
          <StepIndicator currentStep={currentStep} theme={theme} />

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
                style={{
                  fontSize: 20,
                  fontWeight: "600",
                  marginBottom: 16,
                  color: theme.colors.primary,
                }}
              >
                Select Model
              </Text>
              {brandModels.map((model) => (
                <Pressable
                  key={model.name}
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
                  onPress={() => {
                    setSelectedModel(model.name);
                    setSelectedCategory(model.category);
                  }}
                >
                  <Text style={{ fontSize: 16, color: theme.colors.onSurface }}>
                    {model.name}
                  </Text>
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

function StepIndicator({ currentStep, theme }) {
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
                {
                  borderColor:
                    isActive || isCompleted
                      ? theme.colors.primary
                      : theme.colors.outlineVariant || "#ccc",
                  backgroundColor: isCompleted
                    ? theme.colors.primary
                    : theme.colors.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.circleText,
                  {
                    color: isCompleted
                      ? theme.colors.onPrimary
                      : isActive
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant,
                  },
                ]}
              >
                {stepNum}
              </Text>
            </View>
            <Text
              style={[
                styles.stepLabel,
                {
                  color:
                    isActive || isCompleted
                      ? theme.colors.primary
                      : theme.colors.onSurfaceVariant,
                  fontWeight: isActive || isCompleted ? "600" : "400",
                },
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
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 2,
  },
  circleText: {
    fontWeight: "bold",
    fontSize: 15,
  },
  stepLabel: {
    marginTop: 6,
    fontSize: 12,
  },
  card: {
    width: "100%",
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
  },
});
