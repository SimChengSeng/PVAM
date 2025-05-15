import React from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card, Divider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

export default function MaintenanceDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();

  const services = (() => {
    try {
      return params.services ? JSON.parse(params.services) : [];
    } catch (error) {
      console.error("Error parsing services:", error);
      return [];
    }
  })();

  const formatCurrency = (val) => `RM ${Number(val).toFixed(2)}`;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Maintenance Record</Text>
      <Text style={styles.subtitle}>Here is the detailed record</Text>
      <Text style={styles.sectionTitle}>Services Performed</Text>
      {services.map((s, index) => (
        <Card key={index} style={styles.serviceCard}>
          <View style={styles.serviceRow}>
            <Ionicons name="checkmark" size={18} color="#4caf50" />
            <Text style={styles.serviceName}>{s.name}</Text>
            <Text style={styles.serviceCost}>{formatCurrency(s.cost)}</Text>
          </View>
        </Card>
      ))}

      <Divider style={{ marginVertical: 16 }} />
      <Text style={styles.sectionTitle}>Summary</Text>
      <View style={styles.summaryRow}>
        <Text style={styles.label}>Labor Cost:</Text>
        <Text>{formatCurrency(params.laborCost)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.label}>Service Tax:</Text>
        <Text>{formatCurrency(params.serviceTax)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.label}>Total Cost:</Text>
        <Text style={{ fontWeight: "bold" }}>
          {formatCurrency(params.cost)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.label}>Status:</Text>
        <Text
          style={{
            color: params.statusDone === "true" ? "#4caf50" : "#f44336",
          }}
        >
          {params.statusDone === "true" ? "Completed" : "Pending"}
        </Text>
      </View>
      <Divider style={{ marginVertical: 16 }} />
      <Text style={styles.sectionTitle}>Additional Info</Text>
      <Text style={styles.label}>Notes: {params.notes || "None"}</Text>
      <Text style={styles.label}>
        Mileage: {params.currentServiceMileage} km
      </Text>
      <Text style={styles.label}>
        Maintenance Date: {params.nextServiceDate}
      </Text>

      {/* Add Edit and Mark as Done Button */}
      <Pressable
        style={styles.editButton}
        onPress={() =>
          router.push({
            pathname: "/maintenanceManage/maintenanceUpdateForm",
            params: {
              ...params,
              services: JSON.stringify(services), // Pass services as a string
            },
          })
        }
      >
        <Ionicons name="create-outline" size={20} color="#fff" />
        <Text style={styles.editButtonText}>Edit and Mark as Done</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceName: {
    flex: 1,
    marginLeft: 8,
    color: "#333",
  },
  serviceCost: {
    color: "#333",
    fontWeight: "600",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#555",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007bff",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  editButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
});
