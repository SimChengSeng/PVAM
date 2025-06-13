import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Pressable,
} from "react-native";
import { Avatar, Text, Card, Button } from "react-native-paper";
import { getLocalStorage, removeLocalStorage } from "../../service/Storage";
import { signOut, updateProfile } from "firebase/auth";
import { auth } from "../../config/FirebaseConfig";
import { useRouter } from "expo-router"; // Use expo-router's useRouter
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import { globalStyles } from "../../styles/globalStyles";

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
    <View style={globalStyles.container}>
      <Card style={globalStyles.card}>
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
              <Text style={globalStyles.label}>Display Name:</Text>
              <TextInput
                style={globalStyles.input}
                value={updatedDetails.displayName}
                onChangeText={(text) =>
                  setUpdatedDetails({ ...updatedDetails, displayName: text })
                }
              />
              <Text style={globalStyles.label}>Phone Number:</Text>
              <TextInput
                style={globalStyles.input}
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
              <Text style={globalStyles.label}>Phone:</Text>
              <Text style={globalStyles.value}>
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

        <Card.Content>
          <Pressable
            style={{ marginTop: 16 }}
            onPress={() =>
              router.push({
                pathname: "/vehicleManage/DrivingBehaviorForm",
                params: {
                  userEmail: user.email,
                },
              })
            }
          >
            <Text style={{ color: "#007bff", textAlign: "center" }}>
              Fill Driving Behavior Form
            </Text>
          </Pressable>
        </Card.Content>
        <Card.Content>
          <Pressable
            style={{ marginTop: 16 }}
            onPress={() =>
              router.push({
                pathname:
                  "/profileManage/DrivingBehaviorForm/DrivingLevelEstimationForm",
                params: {
                  userEmail: user.email,
                },
              })
            }
          >
            <Text style={{ color: "#007bff", textAlign: "center" }}>
              Fill Driving Level Estimation Form
            </Text>
          </Pressable>
        </Card.Content>
      </Card>
    </View>
  );
}
