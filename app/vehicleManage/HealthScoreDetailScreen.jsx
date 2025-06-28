import React, { useState, useEffect } from "react";
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
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

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
  const [vehicle, setVehicle] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch vehicle data
  const fetchVehicle = async () => {
    const vehicleDocRef = doc(db, "vehicles", vehicleId);
    const vehicleSnap = await getDoc(vehicleDocRef);
    if (vehicleSnap.exists()) {
      setVehicle(vehicleSnap.data());
    }
  };

  useEffect(() => {
    fetchVehicle();
  }, [vehicleId]);

  // Fetch part history
  const fetchPartHistory = (partId, partName) => {
    setLoadingHistory(true);
    setSelectedPart(partName);
    setModalVisible(true);

    // Find the part in partCondition
    const part = vehicle.partCondition.find((p) => p.partId === partId);

    if (part && Array.isArray(part.history)) {
      // Sort by serviceDate descending if needed
      const logs = [...part.history].sort(
        (a, b) => new Date(b.serviceDate) - new Date(a.serviceDate)
      );
      setHistoryLogs(logs);
    } else {
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
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={[styles.header, { color: theme.colors.primary }]}>
            Health Score Details
          </Text>
          <Pressable onPress={() => setShowInfoModal(true)}>
            <Text
              style={{
                fontSize: 20,
                marginLeft: 8,
                paddingBottom: 8,
                color: theme.colors.primary,
              }}
            >
              ℹ️
            </Text>
          </Pressable>
        </View>

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
              <Card.Content>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 18,
                      fontWeight: "bold",
                      color: theme.colors.primary,
                      flex: 1,
                      marginBottom: 8,
                    }}
                  >
                    {part.name}{" "}
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                      {part.score} %
                    </Text>
                  </Text>
                  <Pressable
                    onPress={() => {
                      const selected = vehicle.partCondition.find(
                        (p) => p.partId === part.partId
                      );
                      setSelectedPart(selected);
                      setShowDetailsModal(true);
                    }}
                    style={{ marginLeft: 8 }}
                  >
                    <Text
                      style={{
                        fontSize: 20,
                        color: theme.colors.primary,
                      }}
                    >
                      ℹ️
                    </Text>
                  </Pressable>
                </View>
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
                      Service on Date: {log.serviceDate} • {log.serviceMileage}{" "}
                      km
                    </Text>
                    <Text
                      style={[
                        styles.historyText,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      Cost: {log.cost != null ? `RM ${log.cost}` : "N/A"}
                    </Text>
                    <Text
                      style={[
                        styles.historyText,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      Mechanic: {log.mechanic || "N/A"}
                    </Text>
                    <Text
                      style={[
                        styles.historyText,
                        { color: theme.colors.onSurfaceVariant },
                      ]}
                    >
                      Notes: {log.notes || "N/A"}
                    </Text>
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

        <Modal
          visible={showInfoModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowInfoModal(false)}
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
                How is the Health Score Calculated?
              </Text>
              <Text
                style={
                  (styles.modalText,
                  { color: theme.colors.onSurface, marginBottom: 10 })
                }
              >
                Vehicle Health Score is calculated from three weighted
                components:
              </Text>
              <Text
                style={(styles.bulletText, { color: theme.colors.onSurface })}
              >
                •{" "}
                <Text style={(styles.bold, { color: theme.colors.primary })}>
                  Mileage Score (60%)
                </Text>
                : Based on how far the part has run since its last service.
              </Text>
              <Text
                style={(styles.bulletText, { color: theme.colors.onSurface })}
              >
                •{" "}
                <Text style={(styles.bold, { color: theme.colors.primary })}>
                  Time Score (40%)
                </Text>
                : Based on the time since last service.
              </Text>
              <Text style={styles.bulletText}>
                •{" "}
                <Text style={(styles.bold, { color: theme.colors.primary })}>
                  Penalty
                </Text>
                : Deducted for inspection issues (e.g., Warning/Critical).
              </Text>
              <Pressable
                style={[
                  styles.closeBtn,
                  { backgroundColor: theme.colors.primary, marginTop: 12 },
                ]}
                onPress={() => setShowInfoModal(false)}
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

        <Modal
          visible={showDetailsModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowDetailsModal(false)}
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
                Condition Breakdown
              </Text>

              {selectedPart ? (
                <>
                  <Text style={styles.detailRow}>
                    <Text style={styles.label}>Part Name: </Text>
                    {selectedPart.name}
                  </Text>
                  <Text />
                  <Text style={styles.label}>Last Service :</Text>
                  <Text style={styles.detailRow}>
                    Date: {selectedPart.lastServiceDate || "N/A"}
                  </Text>
                  <Text style={styles.detailRow}>
                    Mileage: {selectedPart.lastServiceMileage || "N/A"} km
                  </Text>
                  <Text />
                  <Text style={styles.label}>Next Service :</Text>
                  <Text style={styles.detailRow}>
                    Date: {selectedPart.nextServiceDate || "N/A"}
                  </Text>
                  <Text style={styles.detailRow}>
                    Mileage: {selectedPart.nextServiceMileage || "N/A"} km
                  </Text>
                  <Text />
                  <Text style={styles.label}>Estimated lifespan :</Text>
                  <Text style={styles.detailRow}>
                    Lifespan (Km): {selectedPart.defaultLifespanKm || "N/A"} km
                  </Text>
                  <Text style={styles.detailRow}>
                    Lifespan (Months):{" "}
                    {selectedPart.defaultLifespanMonth || "N/A"} months
                  </Text>
                </>
              ) : (
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  No data available.
                </Text>
              )}

              <Pressable
                style={[
                  styles.closeBtn,
                  { backgroundColor: theme.colors.primary, marginTop: 12 },
                ]}
                onPress={() => setShowDetailsModal(false)}
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
  bulletText: {
    fontSize: 14,
    marginBottom: 5,
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
  detailRow: {
    fontSize: 14,

    color: "#333",
  },
  label: {
    fontWeight: "bold",
    color: "#555",
    marginTop: 6,
  },
});
