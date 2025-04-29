import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

const VehicleManagementScreen = () => {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleName, setVehicleName] = useState("");
  const [vehicleNumber, setVehicleNumber] = useState("");

  const addVehicle = () => {
    if (vehicleName && vehicleNumber) {
      setVehicles([
        ...vehicles,
        { id: Date.now().toString(), name: vehicleName, number: vehicleNumber },
      ]);
      setVehicleName("");
      setVehicleNumber("");
    }
  };

  const deleteVehicle = (id) => {
    setVehicles(vehicles.filter((vehicle) => vehicle.id !== id));
  };

  const renderVehicle = ({ item }) => (
    <View style={styles.vehicleItem}>
      <Text style={styles.vehicleText}>
        {item.name} - {item.number}
      </Text>
      <TouchableOpacity
        onPress={() => deleteVehicle(item.id)}
        style={styles.deleteButton}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicle Management</Text>
      <TextInput
        style={styles.input}
        placeholder="Vehicle Name"
        value={vehicleName}
        onChangeText={setVehicleName}
      />
      <TextInput
        style={styles.input}
        placeholder="Vehicle Number"
        value={vehicleNumber}
        onChangeText={setVehicleNumber}
      />
      <Button title="Add Vehicle" onPress={addVehicle} />
      <FlatList
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderVehicle}
        style={styles.list}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  list: {
    marginTop: 20,
  },
  record: {
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    marginBottom: 10,
    backgroundColor: "#fff",
  },
  recordText: {
    fontSize: 16,
  },
});
export default VehicleManagementScreen;
