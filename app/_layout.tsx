// app/_layout.js
import { Stack } from "expo-router/stack";
import { Provider as PaperProvider } from "react-native-paper";
import { ThemeProvider, useThemeToggle } from "../context/ThemeContext";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useCallback, useState } from "react";

// Prevent auto-hide until we're ready
SplashScreen.preventAutoHideAsync();

function ThemedLayout() {
  const { theme } = useThemeToggle();
  const isDark = theme.dark;

  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate loading assets or async startup (optional)
        // await someAsyncInit();
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

  if (!appIsReady) return null;

  return (
    <PaperProvider theme={theme}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} onLayout={onLayoutRootView} />
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
