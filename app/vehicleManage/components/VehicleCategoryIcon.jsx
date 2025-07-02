import React from "react";
import { View } from "react-native";

// Car icons
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
import GT from "../../../assets/svg/Car-Icon-GT";

// Motor icons
import MotorSport from "../../../assets/svg/Motor-Icon_Sport";
import MotorChopper from "../../../assets/svg/Motor-Icon-Chopper";
import MotorCruiser from "../../../assets/svg/Motor-Icon-Cruiser";
import MotorOffRoad from "../../../assets/svg/Motor-Icon-OffRoad";
import MotorScooter from "../../../assets/svg/Motor-Icon-Scooter";
import MotorTouring from "../../../assets/svg/Motor-Icon-Touring";
import MotorUnderbone from "../../../assets/svg/Motor-Icon-Underbone";

// Truck & Van
import Truck from "../../../assets/svg/Truck-Icon";
import Van from "../../../assets/svg/Van-Icon";

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
  gt: GT,
  // Motorcycles
  sport: MotorSport,
  chopper: MotorChopper,
  cruiser: MotorCruiser,
  offroad: MotorOffRoad,
  scooter: MotorScooter,
  touring: MotorTouring,
  underbone: MotorUnderbone,
  // Truck & Van
  truck: Truck,
  van: Van,
  minivan: Van,
  CommercialVan: Van,
};

// Map alternative category names to icon keys
const categoryNameMap = {
  crossover: "cuv",

  // Motorcycles
  naked: "cruiser",
  sportbike: "sport",
  chopperCruiser: "chopper",
  cruiserTouring: "touring",
  adventure: "touring",
  cub: "underbone",
  bigbike: "sport",
  street: "cruiser",
  // Truck & Van
  truck: "truck",
  van: "van",
  heavyTruck: "truck",
  lightTruck: "truck",
  mediumTruck: "truck",
  heavyTruck: "truck",
  lightTruck: "truck",
  mediumTruck: "truck",
  minivan: "van",
  commercialVan: "van",
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

export default function VehicleCategoryIcon({
  category,
  color,
  width = 120,
  height = 60,
  style,
}) {
  const key =
    categoryNameMap[category?.toLowerCase()] || category?.toLowerCase();
  const hexColor = colorMap[color?.toLowerCase()] || "#000000";
  const Icon = categoryIcons[key];

  if (!Icon) {
    return null;
  }

  return (
    <View style={[{ alignItems: "center", marginTop: 12, right: 20 }, style]}>
      <Icon
        width={width}
        height={height}
        fill={hexColor}
        style={{ marginLeft: 80 }}
      />
    </View>
  );
}
