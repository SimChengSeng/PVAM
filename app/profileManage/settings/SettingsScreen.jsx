import { useThemeToggle } from "../../../context/ThemeContext";
import { useTheme, Button, Text } from "react-native-paper";
import { View } from "react-native";

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
    </View>
  );
}
