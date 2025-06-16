// context/ThemeContext.js

import React, { createContext, useContext, useState, useEffect } from "react";
import { MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ThemeContext = createContext();

export const useThemeToggle = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      const storedTheme = await AsyncStorage.getItem("APP_THEME");
      if (storedTheme === "dark") setIsDark(true);
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem("APP_THEME", next ? "dark" : "light");
  };

  const theme = isDark ? MD3DarkTheme : MD3LightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
