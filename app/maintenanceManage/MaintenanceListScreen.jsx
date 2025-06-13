import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

// Assume you receive vehicleId via navigation params
const MaintenanceListScreen = ({ route }) => {
  const { vehicleId } = route.params;
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Replace with your API call or data fetching logic
    const fetchMaintenance = async () => {
      try {
        // Example: fetch from API
        // const response = await fetch(`https://your-api.com/vehicles/${vehicleId}/maintenance`);
        // const data = await response.json();
        // setMaintenanceList(data);

        // Mock data for demonstration
        setTimeout(() => {
          setMaintenanceList([
            {
              id: "1",
              title: "Oil Change",
              date: "2024-05-01",
              description: "Changed engine oil",
            },
            {
              id: "2",
              title: "Tire Rotation",
              date: "2024-04-15",
              description: "Rotated all tires",
            },
          ]);
          setLoading(false);
        }, 1000);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchMaintenance();
  }, [vehicleId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (maintenanceList.length === 0) {
    return (
      <View style={styles.centered}>
        <Text>No maintenance records found for this vehicle.</Text>
      </View>
    );
  }

  const renderItem = ({ item }) => (
    <View style={styles.itemContainer}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.date}>{item.date}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={maintenanceList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  itemContainer: {
    backgroundColor: "#f2f2f2",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  title: { fontSize: 16, fontWeight: "bold" },
  date: { fontSize: 14, color: "#888", marginTop: 4 },
  description: { fontSize: 14, marginTop: 8 },
});

export default MaintenanceListScreen;
