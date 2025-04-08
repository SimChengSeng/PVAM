import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

export default function AddVehicleForm() {
  const [form, setForm] = useState({
    make: "",
    model: "",
    year: "",
    licensePlate: "",
    vin: "",
    color: "",
    type: "",
    fuelType: "",
    mileage: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await firestore().collection("vehicles").add(form);
      alert("Vehicle added successfully");
      setForm({
        make: "",
        model: "",
        year: "",
        licensePlate: "",
        vin: "",
        color: "",
        type: "",
        fuelType: "",
        mileage: "",
        notes: "",
      });
    } catch (error) {
      alert("Error adding vehicle: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-4 space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold">Add New Vehicle</h2>

      <Input label="Vehicle Name" {...register("vehicleName")} />
      <Select
        label="Vehicle Type"
        options={["Sedan", "SUV", "Truck"]}
        {...register("vehicleType")}
      />
      <Input
        label="License Plate Number"
        {...register("plate")}
        className="uppercase"
      />
      <Input label="Brand" {...register("brand")} />
      <Input label="Model" {...register("model")} />
      <Input label="Year of Manufacture" type="number" {...register("year")} />
      <Input label="Odometer (km)" type="number" {...register("odometer")} />
      <Select
        label="Fuel Type"
        options={["Petrol", "Diesel", "Hybrid", "Electric"]}
        {...register("fuel")}
      />
      <div className="flex items-center justify-between">
        <label>Default Vehicle?</label>
        <Switch {...register("isDefault")} />
      </div>

      <Button type="submit" className="w-full">
        Add Vehicle
      </Button>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
});
