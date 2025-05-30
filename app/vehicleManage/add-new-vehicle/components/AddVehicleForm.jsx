import React, { useState, useEffect } from "react";
import { db } from "../../../../config/FirebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { View, ScrollView, StyleSheet, Alert } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Switch,
  HelperText,
  ActivityIndicator,
} from "react-native-paper";
import { Dropdown } from "react-native-paper-dropdown";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { getLocalStorage } from "../../../../service/Storage";
import { useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const vehicleSchema = z.object({
  plate: z.string().min(4, "License plate is required"),
  brand: z.string().min(2, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  year: z
    .string()
    .regex(/^\d{4}$/, "Year must be in YYYY format")
    .refine(
      (val) =>
        parseInt(val) >= 1990 && parseInt(val) <= new Date().getFullYear(),
      {
        message: "Enter a valid year",
      }
    ),
  Mileage: z.string().regex(/^\d+$/, "Mileage must be a number"),
  // NextServiceMileage: z.string().regex(/^\d+$/, "Mileage must be a number"),
  vehicleType: z.string(),
  vehicleCategory: z.string(),
  // NextServiceDate: z.string().date(),
  color: z.string(),
  isDefault: z.boolean().optional(),
  engineSize: z.string().optional(),
  cargoCapacity: z.string().optional(),
});

const fixedPartList = [
  {
    partId: "battery",
    name: "Battery",
    defaultLifespanKm: 40000,
    defaultLifespanMonth: 24,
  },
  {
    partId: "tire_front_left",
    name: "Front Tires Left",
    defaultLifespanKm: 40000,
    defaultLifespanMonth: 24,
  },
  {
    partId: "tire_front_right",
    name: "Front Tires Right",
    defaultLifespanKm: 40000,
    defaultLifespanMonth: 24,
  },
  {
    partId: "tire_rear_left",
    name: "Rear Tires Left",
    defaultLifespanKm: 40000,
    defaultLifespanMonth: 24,
  },
  {
    partId: "tire_rear_right",
    name: "Rear Tires Right",
    defaultLifespanKm: 40000,
    defaultLifespanMonth: 24,
  },
  {
    partId: "wiper",
    name: "Wiper Blades",
    defaultLifespanKm: 10000,
    defaultLifespanMonth: 12,
  },
  {
    partId: "car_bulb",
    name: "Car Bulbs",
    defaultLifespanKm: 100000,
    defaultLifespanMonth: 36,
  },
];

export default function AddNewVehicleForm({
  vehicleType,
  vehicleColor,
  vehicleCategory,
  vehicleBrand,
}) {
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleType: vehicleType || "",
      vehicleCategory: vehicleCategory || "",
      plate: "",
      brand: vehicleBrand || "",
      model: "",
      color: vehicleColor || "",
      year: "",
      Mileage: "",
      fuel: "",
      NextServiceDate: "",
      NextServiceMileage: "",
      isDefault: false,
    },
  });

  const [loading, setLoading] = useState(false);
  const [modelList, setModelList] = useState([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [inspectionReminderEnabled, setInspectionReminderEnabled] =
    useState(false);
  const [weeklyInspectionDay, setWeeklyInspectionDay] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchModels = async () => {
      if (!vehicleBrand || !vehicleCategory) return;

      setModelLoading(true);
      try {
        // Reference to the category collection
        const categoryRef = collection(
          db,
          "maintenanceDetails",
          vehicleBrand,
          vehicleCategory
        );

        // Fetch all documents (models) under the category
        const snapshot = await getDocs(categoryRef);

        if (snapshot.empty) {
          console.warn("No models found for the selected brand and category.");
          setModelList([]);
          return;
        }

        // Map document IDs (model names) to the model list
        const models = snapshot.docs.map((doc) => doc.id);
        setModelList(models);
      } catch (error) {
        console.error("Error fetching models:", error);
        setModelList([]);
      } finally {
        setModelLoading(false);
      }
    };

    fetchModels();
  }, [vehicleBrand, vehicleCategory]);

  const onSubmit = async (data) => {
    const user = await getLocalStorage("userDetail");
    setLoading(true);

    try {
      // Fetch maintenance details from Firestore
      const maintenanceDetailsRef = doc(
        db,
        "maintenanceDetails",
        data.brand,
        data.vehicleCategory,
        data.model
      );
      const maintenanceDetailsSnap = await getDoc(maintenanceDetailsRef);

      if (!maintenanceDetailsSnap.exists()) {
        throw new Error("Maintenance details not found for this vehicle.");
      }

      const maintenanceDetails = maintenanceDetailsSnap.data();

      // Create partCondition from maintenance parts
      const partCondition = (maintenanceDetails.parts || []).map((part) => ({
        partId: part.partId,
        name: part.name,
        lastServiceMileage: "",
        lastServiceDate: "",
        defaultLifespanKm: part.defaultLifespanKm,
        defaultLifespanMonth: part.defaultLifespanMonth,
      }));

      // Add fixedPartList to partCondition
      const combinedPartCondition = [
        ...partCondition,
        ...fixedPartList.map((part) => ({
          partId: part.partId,
          name: part.name,
          lastServiceMileage: "",
          lastServiceDate: "",
          defaultLifespanKm: part.defaultLifespanKm,
          defaultLifespanMonth: part.defaultLifespanMonth,
        })),
      ];

      // Add the new vehicle to the "vehicles" collection
      const vehicleRef = collection(db, "vehicles");
      const vehicleDoc = await addDoc(vehicleRef, {
        ...data,
        userEmail: user?.email,
        createdAt: serverTimestamp(),
        partCondition: combinedPartCondition,
        inspectionReminderEnabled,
        weeklyInspectionDay: inspectionReminderEnabled
          ? weeklyInspectionDay
          : null,
        lastWeeklyReminderSent: null, // Initialize as null
      });

      // Compare current mileage to estimate next service
      const currentMileage = parseInt(data.Mileage, 10);
      const nextService = maintenanceDetails.serviceIntervals.find(
        (interval) => interval.interval.km > currentMileage
      );

      if (!nextService) {
        throw new Error("No next service interval found for this mileage.");
      }

      // Automatically add a next maintenance record for the new vehicle
      const maintenanceRef = collection(db, "maintenanceRecords");
      await addDoc(maintenanceRef, {
        userEmail: user?.email,
        vehicleId: vehicleDoc.id, // Reference to the newly added vehicle
        type: nextService.services.map((service) => service.name).join(", "),
        services: nextService.services,
        mechanic: "N/A",
        laborCost: nextService.laborCost,
        serviceTax: nextService.serviceTax,
        cost: nextService.totalCost,
        notes: "Estimated Maintenance",
        nextServiceDate: "N/A", // Use the provided next service date
        estimateNextServiceDate: nextService.interval.month,
        nextServiceMileage: nextService.interval.km,
        currentServiceMileage: currentMileage,
        statusDone: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚗 New Vehicle Added",
          body: `${data.plate} - ${data.brand} ${data.model} has been added successfully.`,
          subtitle: "Vehicle and next maintenance record added successfully!",
          data: {
            type: "vehicle",
            screen: "VehicleDetailScreen",
            vehicle: {
              id: vehicleDoc.id,
              plate: data.plate,
              brand: data.brand,
              model: data.model,
              year: data.year,
              color: data.color,
              Mileage: data.Mileage,
              vehicleCategory: data.vehicleCategory,
              vehicleType: data.vehicleType,
            },
          },
        },
        trigger: null, // immediate
      });

      setLoading(false);
      reset();
      router.push({
        pathname: "/vehicleManage/VehicleDetailScreen",
        params: {
          id: vehicleDoc.id,
          plate: data.plate,
          brand: data.brand,
          model: data.model,
          year: data.year,
          color: data.color,
          Mileage: data.Mileage,
          vehicleCategory: data.vehicleCategory,
          vehicleType: data.vehicleType,
        },
      });
    } catch (error) {
      console.error("Error adding vehicle or maintenance record:", error);
      alert("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[
            styles.container,
            { flexGrow: 1, paddingBottom: 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Vehicle Information</Text>
          <Text style={styles.subtitle}>Enter the details of your vehicle</Text>

          <Controller
            control={control}
            name="plate"
            render={({ field: { onChange, value } }) => (
              <>
                <TextInput
                  label="License Plate"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                  autoCapitalize="characters" // This will auto-uppercase input
                />
                <HelperText type="error" visible={!!errors.plate}>
                  {errors.plate?.message}
                </HelperText>
              </>
            )}
          />

          <Controller
            control={control}
            name="brand"
            render={({ field: { onChange, value } }) => (
              <>
                <TextInput
                  label="Brand"
                  value={value}
                  onChangeText={onChange}
                  mode="outlined"
                />
                <HelperText type="error" visible={!!errors.brand}>
                  {errors.brand?.message}
                </HelperText>
              </>
            )}
          />

          <Controller
            control={control}
            name="model"
            render={({ field: { onChange, value } }) => (
              <>
                <Dropdown
                  label="Model"
                  placeholder="Select Model"
                  mode="outlined"
                  loading={modelLoading}
                  options={modelList.map((model) => ({
                    label: model,
                    value: model,
                  }))}
                  value={value}
                  onSelect={onChange}
                />
                <HelperText type="error" visible={!!errors.model}>
                  {errors.model?.message}
                </HelperText>
              </>
            )}
          />

          <Controller
            control={control}
            name="year"
            render={({ field: { onChange, value } }) => (
              <>
                <Dropdown
                  label="Year of Manufacture"
                  placeholder="Select Year"
                  mode="outlined"
                  options={Array.from(
                    { length: new Date().getFullYear() - 1989 },
                    (_, i) => {
                      const year = 1990 + i;
                      return { label: year.toString(), value: year.toString() };
                    }
                  )}
                  value={value}
                  onSelect={onChange}
                />
                <HelperText type="error" visible={!!errors.year}>
                  {errors.year?.message}
                </HelperText>
              </>
            )}
          />

          <Controller
            control={control}
            name="Mileage"
            render={({ field: { onChange, value } }) => {
              // Format the mileage with commas for display
              const formatMileage = (num) => {
                if (!num) return "";
                return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
              };

              // Remove commas for the actual value
              const unformatMileage = (num) => {
                return num.replace(/,/g, "");
              };

              return (
                <>
                  <TextInput
                    label="Mileage (km)"
                    value={formatMileage(value)}
                    onChangeText={(val) => onChange(unformatMileage(val))}
                    mode="outlined"
                    keyboardType="numeric"
                  />
                  <HelperText type="error" visible={!!errors.Mileage}>
                    {errors.Mileage?.message}
                  </HelperText>
                </>
              );
            }}
          />
          {/* <Controller
        control={control}
        name="NextServiceDate"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="Next Service Date (YYYY-MM-DD)"
              value={value}
              onChangeText={onChange}
              mode="outlined"
              keyboardType="numeric"
            />
            <HelperText type="error" visible={!!errors.NextServiceDate}>
              {errors.NextServiceDate?.message}
            </HelperText>
          </>
        )}
      />
      <Controller
        control={control}
        name="NextServiceMileage"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="Next Service Mileage (Km)"
              value={value}
              onChangeText={onChange}
              mode="outlined"
              keyboardType="numeric"
            />
            <HelperText type="error" visible={!!errors.NextServiceMileage}>
              {errors.NextServiceMileage?.message}
            </HelperText>
          </>
        )}
      /> */}
          {/* <Controller
        control={control}
        name="fuel"
        render={({ field: { onChange, value } }) => (
          <>
            <Dropdown
              label="Fuel Type"
              placeholder="Select Fuel Type"
              mode="outlined"
              options={[
                { label: "Petrol", value: "Petrol" },
                { label: "Diesel", value: "Diesel" },
                { label: "Electric", value: "Electric" },
              ]}
              value={value}
              onSelect={onChange}
            />
            <HelperText type="error" visible={!!errors.fuel}>
              {errors.fuel?.message}
            </HelperText>
          </>
        )}
      /> */}

          <Controller
            control={control}
            name="isDefault"
            render={({ field: { onChange, value } }) => (
              <View style={styles.switchContainer}>
                <Text>Set as Default Vehicle</Text>
                <Switch value={value} onValueChange={onChange} />
              </View>
            )}
          />
          <View style={styles.switchContainer}>
            <Text>Enable Weekly Inspection Reminder</Text>
            <Switch
              value={inspectionReminderEnabled}
              onValueChange={(value) => setInspectionReminderEnabled(value)}
            />
          </View>

          {inspectionReminderEnabled && (
            <Dropdown
              label="Select Weekly Inspection Day"
              placeholder="Choose a day"
              mode="outlined"
              options={[
                { label: "Monday", value: "Monday" },
                { label: "Tuesday", value: "Tuesday" },
                { label: "Wednesday", value: "Wednesday" },
                { label: "Thursday", value: "Thursday" },
                { label: "Friday", value: "Friday" },
                { label: "Saturday", value: "Saturday" },
                { label: "Sunday", value: "Sunday" },
              ]}
              value={weeklyInspectionDay}
              onSelect={setWeeklyInspectionDay}
              style={styles.input}
            />
          )}

          {vehicleType === "motorcycle" && (
            <Controller
              control={control}
              name="engineSize"
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    label="Engine Size (cc)"
                    value={value}
                    onChangeText={onChange}
                    mode="outlined"
                    keyboardType="numeric"
                  />
                  <HelperText type="error" visible={!!errors.engineSize}>
                    {errors.engineSize?.message}
                  </HelperText>
                </>
              )}
            />
          )}

          {vehicleType === "truck" && (
            <Controller
              control={control}
              name="cargoCapacity"
              render={({ field: { onChange, value } }) => (
                <>
                  <TextInput
                    label="Cargo Capacity (kg)"
                    value={value}
                    onChangeText={onChange}
                    mode="outlined"
                    keyboardType="numeric"
                  />
                  <HelperText type="error" visible={!!errors.cargoCapacity}>
                    {errors.cargoCapacity?.message}
                  </HelperText>
                </>
              )}
            />
          )}
          {loading ? (
            <ActivityIndicator
              animating={true}
              size="large"
              style={styles.button}
            />
          ) : (
            <Button
              mode="contained"
              onPress={handleSubmit(onSubmit)}
              style={styles.button}
            >
              Add Vehicle
            </Button>
          )}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
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
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  button: {
    marginTop: 20,
  },
});
