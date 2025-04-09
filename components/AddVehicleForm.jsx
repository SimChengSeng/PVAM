import React from "react";
import { db } from "../config/FirebaseConfig";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { View, ScrollView, StyleSheet } from "react-native";
import {
  TextInput,
  Button,
  Text,
  Switch,
  HelperText,
  RadioButton,
} from "react-native-paper";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const vehicleSchema = z.object({
  vehicleName: z.string().min(2, "Vehicle name is required"),
  vehicleType: z.string().min(1, "Select a vehicle type"),
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
  odometer: z.string().regex(/^\d+$/, "Odometer must be a number"),
  fuel: z.string().min(1, "Select fuel type"),
  isDefault: z.boolean().optional(),
});

export default function AddNewVehicleForm() {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    resolver: zodResolver(vehicleSchema),
    defaultValues: {
      vehicleName: "",
      vehicleType: "",
      plate: "",
      brand: "",
      model: "",
      year: "",
      odometer: "",
      fuel: "",
      isDefault: false,
    },
  });

  const onSubmit = async (data) => {
    try {
      const vehicleRef = collection(db, "vehicles"); // "vehicles" collection
      await addDoc(vehicleRef, {
        ...data,
        createdAt: serverTimestamp(),
      });

      alert("Vehicle added successfully!");
      reset();
    } catch (error) {
      console.error("Error adding vehicle:", error);
      alert("Something went wrong. Try again.");
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text variant="titleLarge" style={styles.title}>
        Add New Vehicle
      </Text>

      <Controller
        control={control}
        name="vehicleName"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="Vehicle Name"
              value={value}
              onChangeText={onChange}
              mode="outlined"
            />
            <HelperText type="error" visible={!!errors.vehicleName}>
              {errors.vehicleName?.message}
            </HelperText>
          </>
        )}
      />

      <Controller
        control={control}
        name="vehicleType"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="Vehicle Type (e.g., Sedan, SUV)"
              value={value}
              onChangeText={onChange}
              mode="outlined"
            />
            <HelperText type="error" visible={!!errors.vehicleType}>
              {errors.vehicleType?.message}
            </HelperText>
          </>
        )}
      />

      <Controller
        control={control}
        name="plate"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="License Plate"
              value={value.toUpperCase()}
              onChangeText={(val) => onChange(val.toUpperCase())}
              mode="outlined"
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
            <TextInput
              label="Model"
              value={value}
              onChangeText={onChange}
              mode="outlined"
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
            <TextInput
              label="Year"
              value={value}
              onChangeText={onChange}
              mode="outlined"
              keyboardType="numeric"
            />
            <HelperText type="error" visible={!!errors.year}>
              {errors.year?.message}
            </HelperText>
          </>
        )}
      />

      <Controller
        control={control}
        name="odometer"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="Odometer (km)"
              value={value}
              onChangeText={onChange}
              mode="outlined"
              keyboardType="numeric"
            />
            <HelperText type="error" visible={!!errors.odometer}>
              {errors.odometer?.message}
            </HelperText>
          </>
        )}
      />

      <Controller
        control={control}
        name="fuel"
        render={({ field: { onChange, value } }) => (
          <>
            <TextInput
              label="Fuel Type (Petrol / Diesel / Electric)"
              value={value}
              onChangeText={onChange}
              mode="outlined"
            />
            <HelperText type="error" visible={!!errors.fuel}>
              {errors.fuel?.message}
            </HelperText>
          </>
        )}
      />

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

      <Button
        mode="contained"
        onPress={handleSubmit(onSubmit)}
        style={styles.button}
      >
        Add Vehicle
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 12,
  },
  title: {
    marginBottom: 16,
    fontWeight: "bold",
    textAlign: "center",
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
