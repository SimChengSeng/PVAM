import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Button, useTheme, Card, Provider } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";

export default function VehicleSelect() {
  const { vehicles } = useLocalSearchParams();
  const parsedVehicles = JSON.parse(vehicles);
  const router = useRouter();
  const theme = useTheme();

  return (
    <Provider>
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          Select a Vehicle to Notify
        </Text>

        {parsedVehicles.map((vehicle) => (
          <Card
            key={vehicle.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
            mode="elevated"
          >
            <Card.Content>
              <Text style={[styles.subtitle, { color: theme.colors.primary }]}>
                {vehicle.plate}
              </Text>
              <Text style={{ color: theme.colors.onSurface }}>
                {vehicle.brand} {vehicle.model} ({vehicle.year})
              </Text>
              <Text style={{ color: theme.colors.onSurface }}>
                Color: {vehicle.color}
              </Text>
              <Text style={{ color: theme.colors.onSurface }}>
                Contactable: {vehicle.isContactable ? "Yes" : "No"}
              </Text>
              {vehicle.isContactable && (
                <Button
                  mode="contained"
                  style={[
                    styles.notifyBtn,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  textColor={theme.colors.onPrimary}
                  onPress={() => {
                    router.push({
                      pathname: "/directlyNotify/components/NotifyForm",
                      params: { vehicle: JSON.stringify(vehicle) },
                    });
                  }}
                >
                  Notify Owner
                </Button>
              )}
            </Card.Content>
          </Card>
        ))}
      </ScrollView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 40 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#000",
  },
  card: {
    borderWidth: 1,
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  notifyBtn: {
    marginTop: 12,
    borderRadius: 8,
  },
});
