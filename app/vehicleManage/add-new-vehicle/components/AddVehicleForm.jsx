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
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Pressable,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Switch,
  HelperText,
  ActivityIndicator,
  Card,
  Divider,
  List,
  Snackbar,
  useTheme,
  Provider,
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
import { scheduleWeeklyReminder } from "../../../../utils/notifications/scheduleWeeklyReminder";
import { TouchableOpacity } from "react-native";
import { AntDesign } from "@expo/vector-icons";

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
  averageUsageDays: z
    .string()
    .regex(/^\d+$/, "Usage days must be a number")
    .optional()
    .or(z.literal("")),
  averageDailyDistance: z
    .string()
    .regex(/^\d+$/, "Distance must be a number")
    .optional()
    .or(z.literal("")),
});

const typeToCollection = {
  car: "maintenanceDetailsCar",
  truck: "maintenanceDetailsTruck",
  motorcycle: "maintenanceDetailsMotorcycle",
  van: "maintenanceDetailsVan",
};

export default function AddNewVehicleForm({
  vehicleType,
  vehicleColor,
  vehicleCategory,
  vehicleBrand,
  vehicleModel,
}) {
  const theme = useTheme();
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
      model: vehicleModel || "",
      color: vehicleColor || "",
      year: "",
      Mileage: "",
      fuel: "",
      NextServiceDate: "",
      NextServiceMileage: "",
      isDefault: false,
      engineSize: "",
      cargoCapacity: "",
      averageUsageDays: "",
      averageDailyDistance: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [inspectionReminderEnabled, setInspectionReminderEnabled] =
    useState(false);
  const [weeklyInspectionDay, setWeeklyInspectionDay] = useState("");
  const [modelLoading, setModelLoading] = useState(false);
  const [modelList, setModelList] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(true); // Always open by default
  const [showEstimation, setShowEstimation] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [showDefaultModal, setShowDefaultModal] = useState(false);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchModels = async () => {
      if (!vehicleBrand || !vehicleCategory || !vehicleType) return;

      setModelLoading(true);
      try {
        // Use the mapping to get the correct collection name
        const selectedCollection = typeToCollection[vehicleType.toLowerCase()];
        if (!selectedCollection) {
          setModelList([]);
          return;
        }

        // Reference to the category collection
        const categoryRef = collection(
          db,
          selectedCollection,
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
  }, [vehicleBrand, vehicleCategory, vehicleType]);

  const onSubmit = async (data) => {
    const user = await getLocalStorage("userDetail");

    setLoading(true);

    try {
      let maintenanceDetails = null;
      let nextService = null;
      let partCondition = [];

      const isCustom =
        data.isCustomModel || data.isCustomCategory || data.isCustom;

      // Only fetch maintenance details for car and truck (not motorcycle/van)
      if (vehicleType !== "truck" && vehicleType !== "van" && !isCustom) {
        const maintenanceDetailsRef = doc(
          db,
          "maintenanceTemplates",
          data.vehicleCategory
        );
        const maintenanceDetailsSnap = await getDoc(maintenanceDetailsRef);

        if (maintenanceDetailsSnap.exists()) {
          maintenanceDetails = maintenanceDetailsSnap.data();

          // Prepare partCondition if parts exist
          if (maintenanceDetails.parts) {
            partCondition = maintenanceDetails.parts.map((part) => ({
              partId: part.partId,
              name: part.name,
              lastServiceMileage: "",
              lastServiceDate: "",
              defaultLifespanKm: part.defaultLifespanKm,
              defaultLifespanMonth: part.defaultLifespanMonth,
              description: part.description,
            }));
          }

          // Find next service only if intervals exist
          if (Array.isArray(maintenanceDetails.serviceIntervals)) {
            const currentMileage = parseInt(data.Mileage, 10);
            nextService = maintenanceDetails.serviceIntervals.find(
              (interval) => interval.interval.km > currentMileage
            );
          }
        }
      }

      // Add the new vehicle
      const vehicleRef = collection(db, "vehicles");
      const vehicleDoc = await addDoc(vehicleRef, {
        ...data,
        userEmail: user?.email,
        userId: user?.uid,
        createdAt: serverTimestamp(),
        partCondition: [
          ...partCondition,
          // ...fixedPartList.map((part) => ({
          //   partId: part.partId,
          //   name: part.name,
          //   lastServiceMileage: "",
          //   lastServiceDate: "",
          //   defaultLifespanKm: part.defaultLifespanKm,
          //   defaultLifespanMonth: part.defaultLifespanMonth,
          // })),
        ],
        inspectionReminderEnabled,
        weeklyInspectionDay: inspectionReminderEnabled
          ? weeklyInspectionDay
          : null,
        lastWeeklyReminderSent: null,
        isContactable: true,
      });

      // Only create maintenance record if nextService is found
      if (nextService) {
        const maintenanceRef = collection(db, "maintenanceRecords");
        await addDoc(maintenanceRef, {
          userEmail: user?.email,
          vehicleId: vehicleDoc.id,
          vehiclePlate: data.plate,
          type: nextService.services.map((s) => s.name).join(", "),
          services: nextService.services,
          mechanic: "N/A",
          laborCost: nextService.laborCost,
          serviceTax: nextService.serviceTax,
          cost: nextService.totalCost,
          notes: "Initial maintenance record created",
          maintenanceCategory: "Estimated Maintenance by PVAM",
          nextServiceDate: "N/A",
          estimateNextServiceDate: nextService.interval.month,
          nextServiceMileage: nextService.interval.km,
          currentServiceMileage: parseInt(data.Mileage, 10),
          statusDone: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🚗 Vehicle Added",
          body: `${data.plate} - ${data.brand} ${data.model} created successfully.`,
          subtitle: nextService
            ? "Next maintenance record also added."
            : "No maintenance record created.",
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
        trigger: null,
      });

      if (inspectionReminderEnabled && weeklyInspectionDay) {
        await scheduleWeeklyReminder(
          weeklyInspectionDay,
          data.plate,
          data.brand,
          data.model,
          vehicleDoc.id
        );
      }

      setLoading(false);
      reset();
      setSnackbarMsg("Vehicle added successfully!");
      setSnackbarVisible(true);
      router.replace({
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
    <Provider>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            contentContainerStyle={[
              styles.container,
              { flexGrow: 1, paddingBottom: 100 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={[styles.title, { color: theme.colors.primary }]}>
              Vehicle Information
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              Enter the details of your vehicle
            </Text>

            <Card
              style={[
                styles.card,
                { backgroundColor: theme.colors.surface, marginBottom: 16 },
              ]}
            >
              <Card.Content>
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    marginBottom: 4,
                    color: theme.colors.primary,
                  }}
                >
                  Brand:{" "}
                  <Text
                    style={{
                      fontWeight: "400",
                      color: theme.colors.onSurface,
                    }}
                  >
                    {vehicleBrand || "-"}
                  </Text>
                </Text>
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    marginBottom: 4,
                    color: theme.colors.primary,
                  }}
                >
                  Model:{" "}
                  <Text
                    style={{
                      fontWeight: "400",
                      color: theme.colors.onSurface,
                    }}
                  >
                    {vehicleModel || "-"}
                  </Text>
                </Text>
                <Text
                  style={{
                    fontWeight: "700",
                    fontSize: 16,
                    color: theme.colors.primary,
                  }}
                >
                  Color:{" "}
                  <Text
                    style={{
                      fontWeight: "400",
                      color: theme.colors.onSurface,
                    }}
                  >
                    {vehicleColor || "-"}
                  </Text>
                </Text>
              </Card.Content>
            </Card>

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
                    autoCapitalize="characters"
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    theme={{
                      colors: {
                        primary: theme.colors.primary,
                        text: theme.colors.onSurface,
                        placeholder: theme.colors.onSurfaceVariant,
                        background: theme.colors.surface,
                      },
                    }}
                    textColor={theme.colors.onSurface}
                  />
                  <HelperText type="error" visible={!!errors.plate}>
                    {errors.plate?.message}
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
                    options={Array.from({ length: 2025 - 1989 + 1 }, (_, i) => {
                      const year = 2025 - i; // 👈 reverse order
                      return { label: year.toString(), value: year.toString() };
                    })}
                    value={value}
                    onSelect={onChange}
                    style={[
                      styles.input,
                      { backgroundColor: theme.colors.surface },
                    ]}
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
                const unformatMileage = (num) => num.replace(/,/g, "");

                return (
                  <>
                    <TextInput
                      label="Mileage (km)"
                      value={formatMileage(value)}
                      onChangeText={(val) => onChange(unformatMileage(val))}
                      mode="outlined"
                      keyboardType="numeric"
                      style={[
                        styles.input,
                        { backgroundColor: theme.colors.surface },
                      ]}
                      theme={{
                        colors: {
                          primary: theme.colors.primary,
                          text: theme.colors.onSurface,
                          placeholder: theme.colors.onSurfaceVariant,
                          background: theme.colors.surface,
                        },
                      }}
                      textColor={theme.colors.onSurface}
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
                <View
                  style={[
                    styles.switchContainer,
                    {
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    },
                  ]}
                >
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{ color: theme.colors.onSurface, fontSize: 16 }}
                    >
                      Set as Default Vehicle
                    </Text>
                    <Pressable onPress={() => setShowDefaultModal(true)}>
                      <Text style={{ fontSize: 16, marginLeft: 6 }}>ℹ️</Text>
                    </Pressable>
                  </View>
                  <Switch
                    value={value}
                    onValueChange={onChange}
                    color={theme.colors.primary}
                  />
                </View>
              )}
            />

            <Modal
              visible={showDefaultModal}
              animationType="fade"
              transparent
              onRequestClose={() => setShowDefaultModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View
                  style={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text
                    style={[styles.modalTitle, { color: theme.colors.primary }]}
                  >
                    What is Default Vehicle?
                  </Text>
                  <Text
                    style={
                      (styles.modalText,
                      { color: theme.colors.onSurface, marginBottom: 10 })
                    }
                  >
                    This option will make this vehicle your default for quick
                    access and display on the top of home screen.
                  </Text>

                  <Pressable
                    style={[
                      styles.closeBtn,
                      { backgroundColor: theme.colors.primary, marginTop: 12 },
                    ]}
                    onPress={() => setShowDefaultModal(false)}
                  >
                    <Text
                      style={{
                        color: theme.colors.onPrimary,
                        textAlign: "center",
                      }}
                    >
                      Close
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Modal>

            <View
              style={[
                styles.switchContainer,
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 8,
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={{ color: theme.colors.onSurface }}>
                  Enable Weekly Inspection Reminder
                </Text>
                <Pressable onPress={() => setShowWeeklyModal(true)}>
                  <Text style={{ fontSize: 16, marginLeft: 6 }}>ℹ️</Text>
                </Pressable>
              </View>
              <Switch
                value={inspectionReminderEnabled}
                onValueChange={(value) => setInspectionReminderEnabled(value)}
                color={theme.colors.primary}
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
                style={[
                  styles.input,
                  { backgroundColor: theme.colors.surface },
                ]}
              />
            )}

            <Modal
              visible={showWeeklyModal}
              animationType="fade"
              transparent
              onRequestClose={() => setShowWeeklyModal(false)}
            >
              <View style={styles.modalOverlay}>
                <View
                  style={[
                    styles.modalContent,
                    { backgroundColor: theme.colors.surface },
                  ]}
                >
                  <Text
                    style={[styles.modalTitle, { color: theme.colors.primary }]}
                  >
                    What is Weekly Inspection Reminder?
                  </Text>
                  <Text
                    style={
                      (styles.modalText,
                      { color: theme.colors.onSurface, marginBottom: 10 })
                    }
                  >
                    Turn this on to receive a reminder each week to inspect your
                    vehicle and keep it in optimal condition.
                  </Text>

                  <Pressable
                    style={[
                      styles.closeBtn,
                      { backgroundColor: theme.colors.primary, marginTop: 12 },
                    ]}
                    onPress={() => setShowWeeklyModal(false)}
                  >
                    <Text
                      style={{
                        color: theme.colors.onPrimary,
                        textAlign: "center",
                      }}
                    >
                      Close
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Modal>

            <Divider style={{ marginVertical: 16 }} />
            {/* Advanced Options */}
            <Card
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
            >
              <TouchableOpacity
                onPress={() => setShowAdvanced((prev) => !prev)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 16,
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 16,
                    color: theme.colors.primary,
                  }}
                >
                  Advanced Information
                </Text>
                <AntDesign
                  name={showAdvanced ? "up" : "down"}
                  size={20}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
              {showAdvanced && (
                <Card.Content>
                  {vehicleType === "car" && (
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
                            style={[
                              styles.inputRounded,
                              { backgroundColor: theme.colors.surface },
                            ]}
                            theme={{
                              colors: {
                                primary: theme.colors.primary,
                                text: theme.colors.onSurface,
                                placeholder: theme.colors.onSurfaceVariant,
                                background: theme.colors.surface,
                              },
                            }}
                            textColor={theme.colors.onSurface}
                          />
                          <HelperText
                            type="error"
                            visible={!!errors.engineSize}
                          >
                            {errors.engineSize?.message}
                          </HelperText>
                        </>
                      )}
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
                            style={[
                              styles.inputRounded,
                              { backgroundColor: theme.colors.surface },
                            ]}
                            theme={{
                              colors: {
                                primary: theme.colors.primary,
                                text: theme.colors.onSurface,
                                placeholder: theme.colors.onSurfaceVariant,
                                background: theme.colors.surface,
                              },
                            }}
                            textColor={theme.colors.onSurface}
                          />
                          <HelperText
                            type="error"
                            visible={!!errors.engineSize}
                          >
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
                            style={[
                              styles.inputRounded,
                              { backgroundColor: theme.colors.surface },
                            ]}
                            theme={{
                              colors: {
                                primary: theme.colors.primary,
                                text: theme.colors.onSurface,
                                placeholder: theme.colors.onSurfaceVariant,
                                background: theme.colors.surface,
                              },
                            }}
                            textColor={theme.colors.onSurface}
                          />
                          <HelperText
                            type="error"
                            visible={!!errors.cargoCapacity}
                          >
                            {errors.cargoCapacity?.message}
                          </HelperText>
                        </>
                      )}
                    />
                  )}
                </Card.Content>
              )}
            </Card>

            {/* Mileage Auto-Estimation */}
            <Card
              style={[styles.card, { backgroundColor: theme.colors.surface }]}
            >
              <TouchableOpacity
                onPress={() => setShowEstimation((prev) => !prev)}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 16,
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontWeight: "bold",
                    fontSize: 16,
                    color: theme.colors.primary,
                  }}
                >
                  Mileage Auto-Estimation
                </Text>
                <AntDesign
                  name={showEstimation ? "up" : "down"}
                  size={20}
                  color={theme.colors.primary}
                />
              </TouchableOpacity>
              {showEstimation && (
                <Card.Content>
                  <Text
                    style={{
                      fontSize: 14,
                      color: theme.colors.onSurfaceVariant,
                      marginBottom: 12,
                    }}
                  >
                    Fill in your average vehicle usage so the app can
                    automatically estimate daily mileage and reduce manual
                    updates.
                  </Text>

                  <Controller
                    control={control}
                    name="averageUsageDays"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <TextInput
                          label="Average Days Used per Week"
                          value={value}
                          onChangeText={onChange}
                          mode="outlined"
                          keyboardType="numeric"
                          style={[
                            styles.inputRounded,
                            { backgroundColor: theme.colors.surface },
                          ]}
                          theme={{
                            colors: {
                              primary: theme.colors.primary,
                              text: theme.colors.onSurface,
                              placeholder: theme.colors.onSurfaceVariant,
                              background: theme.colors.surface,
                            },
                          }}
                          textColor={theme.colors.onSurface}
                        />
                        <HelperText
                          type="error"
                          visible={!!errors.averageUsageDays}
                        >
                          {errors.averageUsageDays?.message}
                        </HelperText>
                      </>
                    )}
                  />

                  <Controller
                    control={control}
                    name="averageDailyDistance"
                    render={({ field: { onChange, value } }) => (
                      <>
                        <TextInput
                          label="Average Distance per Day (km)"
                          value={value}
                          onChangeText={onChange}
                          mode="outlined"
                          keyboardType="numeric"
                          style={[
                            styles.inputRounded,
                            { backgroundColor: theme.colors.surface },
                          ]}
                          theme={{
                            colors: {
                              primary: theme.colors.primary,
                              text: theme.colors.onSurface,
                              placeholder: theme.colors.onSurfaceVariant,
                              background: theme.colors.surface,
                            },
                          }}
                          textColor={theme.colors.onSurface}
                        />
                        <HelperText
                          type="error"
                          visible={!!errors.averageDailyDistance}
                        >
                          {errors.averageDailyDistance?.message}
                        </HelperText>
                      </>
                    )}
                  />
                </Card.Content>
              )}
            </Card>

            {loading ? (
              <ActivityIndicator
                animating={true}
                size="large"
                style={styles.button}
                color={theme.colors.primary}
              />
            ) : (
              <Button
                mode="contained"
                onPress={handleSubmit(onSubmit)}
                style={[
                  styles.button,
                  { backgroundColor: theme.colors.primary },
                ]}
                textColor={theme.colors.onPrimary}
                loading={loading}
                disabled={loading}
              >
                Add Vehicle
              </Button>
            )}

            <Snackbar
              visible={snackbarVisible}
              onDismiss={() => setSnackbarVisible(false)}
              duration={3000}
              action={{
                label: "OK",
                onPress: () => setSnackbarVisible(false),
              }}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: theme.colors.onSurface }}>
                {snackbarMsg}
              </Text>
            </Snackbar>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Provider>
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
    borderRadius: 8,
  },
  card: {
    marginTop: 20,
    borderRadius: 16,
    elevation: 2,
  },
  accordion: {
    backgroundColor: "transparent",
  },
  accordionContent: {
    paddingTop: 12,
    paddingBottom: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  input: {
    marginBottom: 16,
  },
  inputRounded: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
});
