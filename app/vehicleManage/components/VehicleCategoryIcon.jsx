import React from "react";
import { View, Text } from "react-native";

// Import your tintable SVGs (fill="currentColor")
import Sedan from "../../../assets/svg/Car-Icon-Sedan";
import SUV from "../../../assets/svg/Car-Icon-SUV";
import Coupe from "../../../assets/svg/Car-Icon-Coupe";
import Cabriolet from "../../../assets/svg/Car-Icon-Cabriolet";
import Hatchback from "../../../assets/svg/Car-Icon-Hatchback";
import CUV from "../../../assets/svg/Car-Icon-CUV";
import Mirco from "../../../assets/svg/Car-Icon-Mirco";
import MPV from "../../../assets/svg/Car-Icon-MPV";
import Pickup from "../../../assets/svg/Car-Icon-Pickup";
import Supercar from "../../../assets/svg/Car-Icon-Supercar";

// Map category to SVG component
const categoryIcons = {
  sedan: Sedan,
  suv: SUV,
  coupe: Coupe,
  cabriolet: Cabriolet,
  hatchback: Hatchback,
  cuv: CUV,
  mirco: Mirco,
  mpv: MPV,
  pickup: Pickup,
  supercar: Supercar,
};

// Map color labels to HEX codes
const colorMap = {
  black: "#000000",
  white: "#FFFFFF",
  silver: "#C0C0C0",
  red: "#FF0000",
  blue: "#0000FF",
  gray: "#808080",
  green: "#008000",
  yellow: "#FFFF00",
  orange: "#FFA500",
  brown: "#8B4513",
  purple: "#800080",
  gold: "#FFD700",
};

export default function VehicleCategoryIcon({ category, color }) {
  const key = category?.toLowerCase();
  const hexColor = colorMap[color?.toLowerCase()] || "#000000";
  const Icon = categoryIcons[key];

  if (!Icon) {
    return null;
  }

  return (
    <View style={{ alignItems: "center", marginTop: 12, right: 20 }}>
      <Icon
        width={120}
        height={60}
        fill={hexColor}
        style={{ marginLeft: 80 }}
      />
    </View>
  );
}
