import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  FlatList,
  StyleSheet,
} from "react-native";

const MaintenanceScreen = () => {
  const [vehicle, setVehicle] = useState("");
  const [maintenanceType, setMaintenanceType] = useState("");
  const [date, setDate] = useState("");
  const [records, setRecords] = useState([]);

  const addRecord = () => {
    if (vehicle && maintenanceType && date) {
      setRecords([
        ...records,
        { id: Date.now().toString(), vehicle, maintenanceType, date },
      ]);
      setVehicle("");
      setMaintenanceType("");
      setDate("");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.record}>
      <Text style={styles.recordText}>Vehicle: {item.vehicle}</Text>
      <Text style={styles.recordText}>Maintenance: {item.maintenanceType}</Text>
      <Text style={styles.recordText}>Date: {item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vehicle Maintenance</Text>
      <TextInput
        style={styles.input}
        placeholder="Vehicle Name/ID"
        value={vehicle}
        onChangeText={setVehicle}
      />
      <TextInput
        style={styles.input}
        placeholder="Maintenance Type"
        value={maintenanceType}
        onChangeText={setMaintenanceType}
      />
      <TextInput
        style={styles.input}
        placeholder="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
      />
      <Button title="Add Record" onPress={addRecord} />
      <FlatList
        data={records}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
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

export default MaintenanceScreen;
