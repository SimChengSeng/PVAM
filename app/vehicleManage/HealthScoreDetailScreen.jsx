import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Modal, Pressable } from "react-native";
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  useTheme,
  Provider,
} from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "../../config/FirebaseConfig";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";

const getColor = (score, theme) => {
  if (score >= 85) return theme.colors.success || "#22c55e";
  if (score >= 60) return theme.colors.warning || "#ffc107";
  return theme.colors.error || "#dc3545";
};

export default function HealthScoreDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const theme = useTheme();
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
      const q = query(
        collection(db, "vehicles", vehicleId, "partHistory"),
        where("partId", "==", partId),
        orderBy("serviceDate", "desc")
      );
      const querySnapshot = await getDocs(q);
      const logs = querySnapshot.docs.map((doc) => doc.data());
      setHistoryLogs(logs);
    } catch (e) {
      setHistoryLogs([]);
    }

    setLoadingHistory(false);
  };

  return (
    <Provider>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.header, { color: theme.colors.primary }]}>
          Health Score Details
        </Text>
        <Text
          style={[styles.subheader, { color: theme.colors.onSurfaceVariant }]}
        >
          {params.brand} {params.model} • {params.year} • Plate: {params.plate}
        </Text>
        <Text style={[styles.score, { color: theme.colors.primary }]}>
          Total Score: {params.healthScore}%
        </Text>

        {partScores.length > 0 ? (
          partScores.map((part) => (
            <Card
              key={part.partId}
              style={[
                styles.partCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Card.Title
                title={part.name}
                subtitle={`Score: ${part.score}%`}
                titleStyle={{ color: theme.colors.primary }}
                subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
              />
              <Card.Content>
                <View
                  style={[
                    styles.progressWrapper,
                    {
                      backgroundColor:
                        theme.colors.elevation?.level1 || "#e9ecef",
                    },
                  ]}
                >
                  <View
                    style={{
                      width: `${part.score}%`,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: getColor(part.score, theme),
                    }}
                  />
                </View>
                <Text
                  style={[
                    styles.breakdown,
                    { color: theme.colors.onSurfaceVariant },
                  ]}
                >
                  Mileage Score: {(part.mileageScore * 100).toFixed(0)}% | Time
                  Score: {(part.timeScore * 100).toFixed(0)}% | Penalty:{" "}
                  {part.penalty * 100}%
                </Text>
                <Button
                  mode="outlined"
                  style={{ marginTop: 8, borderColor: theme.colors.primary }}
                  textColor={theme.colors.primary}
                  onPress={() => fetchPartHistory(part.partId, part.name)}
                >
                  View Service History
                </Button>
              </Card.Content>
            </Card>
          ))
        ) : (
          <Text style={{ marginTop: 20, color: theme.colors.onSurfaceVariant }}>
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
            <View
              style={[
                styles.modalContent,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <Text
                style={[styles.modalTitle, { color: theme.colors.primary }]}
              >
                {selectedPart ? `${selectedPart} History` : "Part History"}
              </Text>
              {loadingHistory ? (
                <ActivityIndicator color={theme.colors.primary} />
              ) : historyLogs.length > 0 ? (
                historyLogs.map((log, idx) => (
                  <View key={idx} style={styles.historyRow}>
                    <Text
                      style={[
                        styles.historyText,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {log.serviceDate} • {log.mileage} km
                    </Text>
                    {log.note ? (
                      <Text
                        style={[
                          styles.historyText,
                          { color: theme.colors.onSurfaceVariant },
                        ]}
                      >
                        Note: {log.note}
                      </Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No history found.
                </Text>
              )}
              <Pressable
                style={[
                  styles.closeBtn,
                  { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setModalVisible(false)}
              >
                <Text
                  style={{ color: theme.colors.onPrimary, textAlign: "center" }}
                >
                  Close
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
    paddingTop: 40,
    minHeight: "100%",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subheader: {
    fontSize: 14,
    marginBottom: 16,
  },
  score: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  partCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 8,
    elevation: 2,
  },
  progressWrapper: {
    width: "100%",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginVertical: 6,
  },
  breakdown: {
    fontSize: 12,
    marginTop: 4,
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
  historyRow: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 6,
  },
  historyText: {
    fontSize: 13,
  },
  closeBtn: {
    marginTop: 16,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});
