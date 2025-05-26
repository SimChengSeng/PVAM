import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Text, Card } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

const getColor = (score) => {
  if (score >= 85) return "#28a745"; // Green
  if (score >= 60) return "#ffc107"; // Yellow
  return "#dc3545"; // Red
};

export default function HealthScoreDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const partScores = JSON.parse(params.partScores || "[]");

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
            </Card.Content>
          </Card>
        ))
      ) : (
        <Text style={{ marginTop: 20, color: "#888" }}>
          No part condition data available.
        </Text>
      )}
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
});
