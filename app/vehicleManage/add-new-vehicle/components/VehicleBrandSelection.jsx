import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { db } from "../../../../config/FirebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const BrandSelectionScreen = ({ onSelectBrand }) => {
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const brandCollection = collection(db, "maintenanceDetails");
        const snapshot = await getDocs(brandCollection);
        const brandList = snapshot.docs.map((doc) => doc.id);
        setBrands(brandList);
      } catch (error) {
        console.error("Error fetching brands:", error);
      }
    };

    fetchBrands();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Choose Car Brand</Text>
      <Text style={styles.subtitle}>
        Select the Brand of car you want to add
      </Text>
      <View style={styles.grid}>
        {brands.map((brand, index) => (
          <TouchableOpacity
            key={index}
            style={styles.card}
            onPress={() => onSelectBrand(brand)}
          >
            {/* Optional: Add brand logos here */}
            <Text style={styles.label}>{brand}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "gray",
    marginBottom: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 16,
  },
  card: {
    width: 120,
    height: 120,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    elevation: 4,
    margin: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  label: {
    marginTop: 5,
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
  },
});

export default BrandSelectionScreen;
