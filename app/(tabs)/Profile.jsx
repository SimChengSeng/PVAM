import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Avatar, Text, Card, Button } from "react-native-paper";
import { getLocalStorage, removeLocalStorage } from "../../service/Storage";
import { signOut } from "firebase/auth";
import { auth } from "../../config/FirebaseConfig";
import { useNavigation } from "@react-navigation/native";

export default function ProfileScreen() {
  const [user, setUser] = useState({});
  const navigation = useNavigation();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getLocalStorage("userDetail");
      setUser(userData || {});
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    await removeLocalStorage();
    navigation.navigate("(auth)/login");
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title={user.displayName || "User Name"}
          subtitle={user.email || "Email Address"}
          left={() => (
            <Avatar.Text
              size={50}
              label={user.displayName?.charAt(0) || "U"}
              style={{ alignSelf: "center" }}
            />
          )}
        />
        <Card.Content>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>
            {user.phoneNumber || "Not available"}
          </Text>
        </Card.Content>
        <Card.Actions>
          <Button onPress={handleLogout} mode="contained" buttonColor="#f44336">
            Logout
          </Button>
        </Card.Actions>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#1e1e2f",
  },
  card: {
    borderRadius: 12,
  },
  label: {
    marginTop: 8,
    fontWeight: "bold",
  },
  value: {
    marginBottom: 12,
  },
});
