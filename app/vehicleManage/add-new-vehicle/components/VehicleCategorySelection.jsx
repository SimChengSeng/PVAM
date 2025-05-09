import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import React from "react";

export default function VehicleCategorySelection({
  vehicleType,
  onSelectType,
}) {
  const carCategories = [
    {
      label: "Sedan",
      image: require("../../../../assets/images/vehicleType/Sedan.jpg"),
    },
    {
      label: "Hatchback",
      image: require("../../../../assets/images/vehicleType/Hatchback.jpg"),
    },
    {
      label: "SUV",
      image: require("../../../../assets/images/vehicleType/SUV.jpg"),
    },
    {
      label: "CUV",
      image: require("../../../../assets/images/vehicleType/CUV.jpg"),
    },
    {
      label: "Pickup",
      image: require("../../../../assets/images/vehicleType/Pickup.jpg"),
    },
    {
      label: "Coupe",
      image: require("../../../../assets/images/vehicleType/Coupe.jpg"),
    },
    {
      label: "Cabriolet",
      image: require("../../../../assets/images/vehicleType/Cabriolet.jpg"),
    },
    {
      label: "Micro",
      image: require("../../../../assets/images/vehicleType/Micro.jpg"),
    },
    {
      label: "Supercar",
      image: require("../../../../assets/images/vehicleType/Supercar.jpg"),
    },
    {
      label: "Roadster",
      image: require("../../../../assets/images/vehicleType/Roadster.jpg"),
    },
  ];

  const motorcycleCategories = [
    {
      label: "Sportbike",
      image: require("../../../../assets/images/vehicleType/motorcycle/SportBike.jpg"),
    },
    // {
    //   label: "Sportbike",
    //   image: require("../../assets/images/motorcycleType/Sportbike.jpg"),
    // },
    // {
    //   label: "Touring",
    //   image: require("../../assets/images/motorcycleType/Touring.jpg"),
    // },
    // {
    //   label: "Scooter",
    //   image: require("../../assets/images/motorcycleType/Scooter.jpg"),
    // },
    // {
    //   label: "Off-Road",
    //   image: require("../../assets/images/motorcycleType/OffRoad.jpg"),
    // },
  ];

  const truckCategories = [
    // {
    //   label: "Box Truck",
    //   image: require("../../assets/images/truckType/BoxTruck.jpg"),
    // },
    // {
    //   label: "Tow Truck",
    //   image: require("../../assets/images/truckType/TowTruck.jpg"),
    // },
    // {
    //   label: "Dump Truck",
    //   image: require("../../assets/images/truckType/DumpTruck.jpg"),
    // },
    // {
    //   label: "Flatbed",
    //   image: require("../../assets/images/truckType/Flatbed.jpg"),
    // },
  ];

  const otherCategories = [
    // { label: "Bus", image: require("../../assets/images/otherType/Bus.jpg") },
    // { label: "Van", image: require("../../assets/images/otherType/Van.jpg") },
    // {
    //   label: "Tractor",
    //   image: require("../../assets/images/otherType/Tractor.jpg"),
    // },
    // { label: "ATV", image: require("../../assets/images/otherType/ATV.jpg") },
  ];

  let categoriesToShow = [];

  switch (vehicleType) {
    case "car":
      categoriesToShow = carCategories;
      break;
    case "motorcycle":
      categoriesToShow = motorcycleCategories;
      break;
    case "truck":
      categoriesToShow = truckCategories;
      break;
    case "others":
      categoriesToShow = otherCategories;
      break;
    default:
      categoriesToShow = [];
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.title}>Choose {vehicleType} Category</Text>
      <Text style={styles.subtitle}>
        Select the Category of {vehicleType} you want to add
      </Text>
      <View style={styles.grid}>
        {categoriesToShow.map((Category) => (
          <Pressable
            key={Category.label}
            style={styles.card}
            onPress={() => onSelectType(Category.label.toLowerCase())}
          >
            <Image source={Category.image} style={styles.image} />
            <Text style={styles.label}>{Category.label}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 200, // extra space at the bottom
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    textTransform: "capitalize",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 24,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  card: {
    width: "47%",
    aspectRatio: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 4,
  },
  image: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
});
