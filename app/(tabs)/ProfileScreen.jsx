import React, { useEffect, useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { Avatar, Text, Card, Button } from "react-native-paper";
import { getLocalStorage, removeLocalStorage } from "../../service/Storage";
import { signOut, updateProfile } from "firebase/auth";
import { auth } from "../../config/FirebaseConfig";
import { useRouter } from "expo-router"; // Use expo-router's useRouter
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";

export default function ProfileScreen() {
  const [user, setUser] = useState({});
  const [isEditing, setIsEditing] = useState(false); // Toggle for editing
  const [updatedDetails, setUpdatedDetails] = useState({});
  const router = useRouter(); // Use router for navigation

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getLocalStorage("userDetail");
      setUser(userData || {});
      setUpdatedDetails(userData || {}); // Initialize updated details
    };
    loadUser();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    await removeLocalStorage();
    router.replace("(auth)/LoginScreen"); // Navigate to LoginScreen
  };

  const handleSaveDetails = async () => {
    try {
      // Update Firebase Auth profile
      if (updatedDetails.displayName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: updatedDetails.displayName,
        });
      }

      // Update Firestore user document
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: updatedDetails.displayName,
        phoneNumber: updatedDetails.phoneNumber,
      });

      // Update local state and storage
      setUser(updatedDetails);
      await getLocalStorage("userDetail", updatedDetails);

      setIsEditing(false); // Exit editing mode
      console.log("User details updated successfully");
    } catch (error) {
      console.error("Error updating user details:", error);
    }
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
          {isEditing ? (
            <>
              <Text style={styles.label}>Display Name:</Text>
              <TextInput
                style={styles.input}
                value={updatedDetails.displayName}
                onChangeText={(text) =>
                  setUpdatedDetails({ ...updatedDetails, displayName: text })
                }
              />
              <Text style={styles.label}>Phone Number:</Text>
              <TextInput
                style={styles.input}
                value={updatedDetails.phoneNumber}
                onChangeText={(text) =>
                  setUpdatedDetails({ ...updatedDetails, phoneNumber: text })
                }
                keyboardType="phone-pad"
              />
              {/* Add more fields as needed */}
            </>
          ) : (
            <>
              <Text style={styles.label}>Phone:</Text>
              <Text style={styles.value}>
                {user.phoneNumber || "Not available"}
              </Text>
            </>
          )}
        </Card.Content>
        <Card.Actions>
          {isEditing ? (
            <>
              <Button
                onPress={handleSaveDetails}
                mode="contained"
                buttonColor="#4caf50"
              >
                Save
              </Button>
              <Button
                onPress={() => setIsEditing(false)}
                mode="outlined"
                buttonColor="#f44336"
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              onPress={() => setIsEditing(true)}
              mode="contained"
              buttonColor="#007aff"
            >
              Edit Details
            </Button>
          )}
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
    color: "#fff",
  },
  value: {
    marginBottom: 12,
    color: "#fff",
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
});
