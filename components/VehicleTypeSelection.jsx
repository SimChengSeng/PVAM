import { View, Text, TouchableOpacity, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";

const vehicleTypes = [
  { label: "Car", type: "car" },
  {
    label: "Motorcycle",
    type: "motorcycle",
  },
  { label: "Truck", type: "truck" },
];

export default function VehicleTypeSelection() {
  const navigation = useNavigation();

  return (
    <View className="p-4 flex flex-wrap flex-row justify-center">
      {vehicleTypes.map((vehicle) => (
        <TouchableOpacity
          key={vehicle.type}
          className="m-4 items-center"
          onPress={() =>
            navigation.navigate("AddVehicleForm", { vehicleType: vehicle.type })
          }
        >
          <Image source={vehicle.icon} className="w-24 h-24 mb-2" />
          <Text>{vehicle.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
