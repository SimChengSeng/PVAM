import { MD3LightTheme, MD3DarkTheme } from "react-native-paper";
import { LightColors, DarkColors } from "../constant/Colors";

export const CustomLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...LightColors,
  },
};

export const CustomDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...DarkColors,
  },
};
