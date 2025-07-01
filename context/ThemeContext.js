import React, { createContext, useContext } from "react";
import { useColorScheme } from "react-native";
import { CustomDarkTheme, CustomLightTheme } from "../theme/index";

const ThemeContext = createContext();

export const useThemeToggle = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const colorScheme = useColorScheme(); // 'light' or 'dark'
  const isDark = colorScheme === "dark";
  const theme = isDark ? CustomDarkTheme : CustomLightTheme;

  return (
    <ThemeContext.Provider value={{ isDark, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
