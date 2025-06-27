// app/_layout.js
import { Stack } from "expo-router";
import { Provider as PaperProvider } from "react-native-paper";
import { ThemeProvider, useThemeToggle } from "../context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useCallback, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View, ActivityIndicator } from "react-native";

// Prevent auto-hide until we're ready
SplashScreen.preventAutoHideAsync();

function ThemedLayout() {
  const { theme } = useThemeToggle();
  const isDark = theme.dark;

  const [appIsReady, setAppIsReady] = useState(false);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);

  useEffect(() => {
    async function prepare() {
      try {
        const seen = await AsyncStorage.getItem("hasSeenWelcome");
        setInitialRoute(seen === "true" ? "/(tabs)/1_index" : "/(auth)/welcome");
      } catch (e) {
        console.warn("Startup error:", e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady || !initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{ headerShown: false }}
        initialRouteName={initialRoute}
        onLayout={onLayoutRootView}
      />
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
