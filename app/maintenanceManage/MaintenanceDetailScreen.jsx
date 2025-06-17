import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from "react-native";
import { doc, deleteDoc } from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Card, Divider, useTheme } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { db } from "../../config/FirebaseConfig";

export default function MaintenanceDetailScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();

  const services = (() => {
    try {
      return params.services ? JSON.parse(params.services) : [];
    } catch (error) {
      console.error("Error parsing services:", error);
      return [];
    }
  })();

  const formatCurrency = (val) =>
    val !== undefined && val !== null && val !== ""
      ? `RM ${Number(val).toFixed(2)}`
      : "-";

  if (!params.id) {
    Alert.alert("Error", "Maintenance record ID is missing.");
    return null;
  }

  const statusDone = params.statusDone === "true" || params.statusDone === true;

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <Text style={[styles.title, { color: theme.colors.primary }]}>
        Maintenance Record
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
        Here is the detailed record
      </Text>

      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        Services Performed
      </Text>
      {services.length === 0 ? (
        <Text
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 12 }}
        >
          No services found.
        </Text>
      ) : (
        services.map((s, index) => (
          <Card
            key={index}
            style={[
              styles.serviceCard,
              {
                backgroundColor:
                  theme.colors.elevation?.level2 ||
                  theme.colors.secondaryContainer,
              },
            ]}
          >
            <View style={styles.serviceRow}>
              <Ionicons
                name="checkmark"
                size={18}
                color={theme.colors.primary}
              />
              <Text
                style={[styles.serviceName, { color: theme.colors.onSurface }]}
              >
                {s.name}
              </Text>
              {s.cost !== undefined && s.cost !== null && s.cost !== "" && (
                <Text
                  style={[
                    styles.serviceCost,
                    { color: theme.colors.onSurface },
                  ]}
                >
                  {formatCurrency(s.cost)}
                </Text>
              )}
            </View>
          </Card>
        ))
      )}

      <Divider
        style={{
          marginVertical: 16,
          backgroundColor: theme.colors.outlineVariant,
        }}
      />

      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        Summary
      </Text>
      <View style={styles.summaryRow}>
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Labor Cost:
        </Text>
        <Text style={{ color: theme.colors.onSurface }}>
          {formatCurrency(params.laborCost)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Service Tax:
        </Text>
        <Text style={{ color: theme.colors.onSurface }}>
          {formatCurrency(params.serviceTax)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Total Cost:
        </Text>
        <Text style={{ fontWeight: "bold", color: theme.colors.primary }}>
          {formatCurrency(params.cost)}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Status:
        </Text>
        <Text
          style={{
            color: statusDone
              ? theme.colors.success || "#4caf50"
              : theme.colors.error || "#f44336",
            fontWeight: "bold",
          }}
        >
          {statusDone ? "Completed" : "Pending"}
        </Text>
      </View>

      <Divider
        style={{
          marginVertical: 16,
          backgroundColor: theme.colors.outlineVariant,
        }}
      />

      <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>
        Additional Info
      </Text>
      <View style={styles.infoRow}>
        <Ionicons
          name="document-text-outline"
          size={18}
          color={theme.colors.primary}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Notes:
        </Text>
        <Text style={{ color: theme.colors.onSurface, flex: 1 }}>
          {params.notes || "None"}
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons
          name="speedometer-outline"
          size={18}
          color={theme.colors.primary}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Mileage:
        </Text>
        <Text style={{ color: theme.colors.onSurface }}>
          {params.currentServiceMileage || "-"} km
        </Text>
      </View>
      <View style={styles.infoRow}>
        <Ionicons
          name="calendar-outline"
          size={18}
          color={theme.colors.primary}
          style={{ marginRight: 8 }}
        />
        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
          Maintenance Date:
        </Text>
        <Text style={{ color: theme.colors.onSurface }}>
          {params.nextServiceDate || "-"}
        </Text>
      </View>
      <Pressable
        style={[styles.editButton, { flexDirection: "row" }]}
        onPress={() =>
          router.push({
            pathname: "/maintenanceManage/maintenanceUpdateForm",
            params: {
              ...params,
              services: JSON.stringify(services),
            },
          })
        }
      >
        <Ionicons name="create-outline" size={20} color="#fff" />
        <Text style={styles.editButtonText}>Edit or Mark as Done</Text>
      </Pressable>

      <Pressable
        style={[
          styles.deleteButton,
          {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          },
        ]}
        onPress={() =>
          Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this maintenance record?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                  try {
                    const recordRef = doc(db, "maintenanceRecords", params.id);
                    await deleteDoc(recordRef);
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.push("/maintenanceManage");
                    }
                  } catch (error) {
                    Alert.alert(
                      "Error",
                      "Failed to delete the maintenance record."
                    );
                  }
                },
              },
            ]
          )
        }
      >
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.deleteButtonText}>Delete</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 40,
    minHeight: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 16,
  },
  serviceCard: {
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
    fontSize: 15,
  },
  serviceCost: {
    fontWeight: "600",
    fontSize: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    minWidth: 80,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 4,
  },
  editButton: {
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
  deleteButton: {
    backgroundColor: "#dc3545",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
});
