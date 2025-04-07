import { View, Text, Button, TouchableOpacity, StyleSheet } from "react-native";
import React from "react";
import Colors from "../../constant/Colors";
import { signOut } from "firebase/auth";
import { auth } from "../../config/FirebaseConfig";
import { removeLocalStorage } from "../../service/Storage";
import { useNavigation } from "@react-navigation/native";

export default function Profile() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await signOut(auth);
    await removeLocalStorage();
    navigation.navigate("(auth)/login");
  };

  return (
    <View>
      <Text>Profile</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text
          style={{ fontSize: 16, color: Colors.PRIMARY, textAlign: "center" }}
        >
          Logout
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 15,
    backgroundColor: "white",
    borderRadius: 99,
    marginTop: 25,
  },
});
