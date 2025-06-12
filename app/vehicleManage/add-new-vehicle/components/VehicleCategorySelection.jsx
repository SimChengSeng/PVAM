import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../../config/FirebaseConfig";

export default function VehicleCategorySelection({
  vehicleType,
  vehicleBrand,
  onSelectType,
}) {
  const [availableCategories, setAvailableCategories] = useState([]);

  const categoryImageMap = {
    Sedan: require("../../../../assets/images/vehicleType/Sedan.jpg"),
    Hatchback: require("../../../../assets/images/vehicleType/Hatchback.jpg"),
    SUV: require("../../../../assets/images/vehicleType/SUV.jpg"),
    CUV: require("../../../../assets/images/vehicleType/CUV.jpg"),
    Pickup: require("../../../../assets/images/vehicleType/Pickup.jpg"),
    Coupe: require("../../../../assets/images/vehicleType/Coupe.jpg"),
    Cabriolet: require("../../../../assets/images/vehicleType/Cabriolet.jpg"),
    Micro: require("../../../../assets/images/vehicleType/Micro.jpg"),
    Supercar: require("../../../../assets/images/vehicleType/Supercar.jpg"),
    Roadster: require("../../../../assets/images/vehicleType/Roadster.jpg"),
    Sportbike: require("../../../../assets/images/vehicleType/motorcycle/SportBike.jpg"),
  };

  useEffect(() => {
    if (!vehicleType || !vehicleBrand) return;

    const fetchCategories = async () => {
      try {
        const typeToCollection = {
          car: "maintenanceDetailsCar",
          truck: "maintenanceDetailsTruck",
          motorcycle: "maintenanceDetailsMotorcycle",
          others: "maintenanceDetailsOther",
        };

        const selectedCollection = typeToCollection[vehicleType.toLowerCase()];
        if (!selectedCollection) return;

        const possibleCategories = Object.keys(categoryImageMap);
        const validCategories = [];

        for (const category of possibleCategories) {
          const categoryRef = collection(
            db,
            selectedCollection,
            vehicleBrand,
            category
          );
          const snapshot = await getDocs(categoryRef);
          if (!snapshot.empty) {
            validCategories.push(category);
          }
        }

        setAvailableCategories(validCategories);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, [vehicleType, vehicleBrand]);

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
        {availableCategories.map((category) => (
          <Pressable
            key={category}
            style={styles.card}
            onPress={() => onSelectType(category)}
          >
            <Image
              source={
                categoryImageMap[category] ||
                require("../../../../assets/images/vehicleType/Sedan.jpg")
              }
              style={styles.image}
            />
            <Text style={styles.label}>{category}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 200,
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
  label: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
});
