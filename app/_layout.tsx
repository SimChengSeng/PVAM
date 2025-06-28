import { Stack } from "expo-router/stack";
import { Provider as PaperProvider } from "react-native-paper";
import { ThemeProvider, useThemeToggle } from "../context/ThemeContext";
import { StatusBar } from "expo-status-bar";

function ThemedLayout() {
  const { theme } = useThemeToggle();
  const isDark = theme.dark;

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
    </PaperProvider>
  );
}

export default function Layout() {
  return (
    <ThemeProvider>
      <ThemedLayout />
    </ThemeProvider>
  );
}
