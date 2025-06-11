import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Modal, Pressable } from "react-native";
import { Text, Card, Button, ActivityIndicator } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "../../config/FirebaseConfig";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

const getColor = (score) => {
  if (score >= 85) return "#28a745";
  if (score >= 60) return "#ffc107";
  return "#dc3545";
};

export default function HealthScoreDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const partScores = JSON.parse(params.partScores || "[]");
  const vehicleId = params.vehicleId;

  // State for modal and history
  const [modalVisible, setModalVisible] = useState(false);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedPart, setSelectedPart] = useState(null);

  // Fetch part history
  const fetchPartHistory = async (partId, partName) => {
    setLoadingHistory(true);
    setSelectedPart(partName);
    setModalVisible(true);

    try {
      console.log("🚗 Fetching history for", partId, "on vehicle", vehicleId);
      const q = query(
        collection(db, "vehicles", vehicleId, "partHistory"),
        where("partId", "==", partId),
        orderBy("serviceDate", "desc")
      );
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map((doc) => doc.data());
      console.log("📦 Found logs:", logs);
      setHistoryLogs(logs);
    } catch (e) {
      console.error("❌ Error fetching part history:", e);
      setHistoryLogs([]);
    }

    setLoadingHistory(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Health Score Details</Text>
      <Text style={styles.subheader}>
        {params.brand} {params.model} • {params.year} • Plate: {params.plate}
      </Text>
      <Text style={styles.score}>Total Score: {params.healthScore}%</Text>

      {partScores.length > 0 ? (
        partScores.map((part) => (
          <Card key={part.partId} style={styles.partCard}>
            <Card.Title title={part.name} subtitle={`Score: ${part.score}%`} />
            <Card.Content>
              <View style={styles.progressWrapper}>
                <View
                  style={{
                    width: `${part.score}%`,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: getColor(part.score),
                  }}
                />
              </View>
              <Text style={styles.breakdown}>
                Mileage Score: {(part.mileageScore * 100).toFixed(0)}% | Time
                Score: {(part.timeScore * 100).toFixed(0)}% | Penalty:{" "}
                {part.penalty * 100}%
              </Text>
              <Button
                mode="outlined"
                style={{ marginTop: 8 }}
                onPress={() => fetchPartHistory(part.partId, part.name)}
              >
                View Service History
              </Button>
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text style={{ marginTop: 20, color: "#888" }}>
          No part condition data available.
        </Text>
      )}

      {/* Modal for part history */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedPart ? `${selectedPart} History` : "Part History"}
            </Text>
            {loadingHistory ? (
              <ActivityIndicator />
            ) : historyLogs.length > 0 ? (
              historyLogs.map((log, idx) => (
                <View key={idx} style={styles.historyRow}>
                  <Text style={styles.historyText}>
                    {log.serviceDate} • {log.mileage} km
                  </Text>
                  <Text style={styles.historyText}>
                    {log.note ? `Note: ${log.note}` : ""}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ color: "#888" }}>No history found.</Text>
            )}
            <Pressable
              style={styles.closeBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: "#fff", textAlign: "center" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subheader: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  score: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
    marginBottom: 16,
  },
  partCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 8,
    elevation: 2,
  },
  progressWrapper: {
    width: "100%",
    height: 10,
    backgroundColor: "#e9ecef",
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: 6,
  },
  breakdown: {
    fontSize: 12,
    color: "#444",
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  historyRow: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 6,
  },
  historyText: {
    fontSize: 13,
    color: "#444",
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: "#007bff",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
