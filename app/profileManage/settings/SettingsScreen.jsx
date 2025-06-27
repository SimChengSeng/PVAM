import React from "react";
import { useThemeToggle } from "../../../context/ThemeContext";
import { useTheme, Button, Text } from "react-native-paper";
import { View } from "react-native";
import { scheduleTestReminder } from "../../../utils/notifications/scheduleTestReminder"; // Adjust path

export default function SettingsScreen() {
  const { isDark, toggleTheme } = useThemeToggle();
  const { colors } = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ color: colors.onBackground, marginBottom: 20 }}>
        Current theme: {isDark ? "Dark" : "Light"}
      </Text>
      <Button mode="contained-tonal" onPress={toggleTheme}>
        Switch to {isDark ? "Light" : "Dark"} Mode
      </Button>

      <Button
        mode="contained"
        onPress={async () => {
          const id = await scheduleTestReminder();
          console.log("✅ Scheduled test reminder with ID:", id);
        }}
        style={{ marginTop: 16 }}
      >
        Test 1-Min Reminder
      </Button>
    </View>
  );
}
