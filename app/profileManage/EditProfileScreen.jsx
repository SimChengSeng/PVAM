import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  Text,
  Card,
  IconButton,
  Divider,
  Avatar,
  Button,
  TextInput,
} from "react-native-paper";
import { useRouter } from "expo-router";
import { getLocalStorage } from "../../service/Storage";
import { auth, db } from "../../config/FirebaseConfig";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";

export default function EditProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState({});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
  });

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getLocalStorage("userDetail");
      setUser(userData || {});
      setForm({
        displayName: userData?.displayName || "",
        email: userData?.email || "",
      });
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    try {
      // Update Firebase Auth
      if (auth.currentUser && form.displayName !== user.displayName) {
        await updateProfile(auth.currentUser, {
          displayName: form.displayName,
        });
      }

      // Update Firestore
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userDocRef, {
        displayName: form.displayName,
      });

      // Update local state
      setUser({ ...user, displayName: form.displayName });
      setEditing(false);
    } catch (error) {
      console.error("Error updating user info:", error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.sectionHeader}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Identity Information</Text>
        </View>

        {/* Identity Info */}
        <Card style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Legal full name</Text>
            {editing ? (
              <TextInput
                value={form.displayName}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, displayName: text }))
                }
                style={styles.input}
                mode="flat"
              />
            ) : (
              <Text style={styles.infoValue}>{user.displayName}</Text>
            )}
          </View>
          <Divider />
          <InfoRow label="Identity number" value="0*********" />
          <Divider />
          <InfoRow label="Date of birth" value="0*/**/***0" />
        </Card>

        {/* Email Section */}
        <Card style={[styles.card, { marginTop: 16 }]}>
          <View style={styles.emailHeader}>
            <Text style={styles.infoLabel}>Email</Text>
            <View style={styles.emailRight}>
              <Text style={styles.verified}>Verified</Text>
              <Avatar.Icon
                icon="check-circle"
                size={18}
                color="green"
                style={{ backgroundColor: "transparent", marginRight: 0 }}
              />
            </View>
          </View>

          <View style={styles.emailValueRow}>
            {editing ? (
              <TextInput
                value={form.email}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, email: text }))
                }
                style={styles.input}
                keyboardType="email-address"
              />
            ) : (
              <>
                <Text style={styles.emailValue}>
                  {user.email?.replace(
                    /(.{1}).+(@.+)/,
                    (_, a, b) => a + "********" + b
                  )}
                </Text>
                <IconButton
                  icon="pencil"
                  size={18}
                  onPress={() => setEditing(true)}
                />
              </>
            )}
          </View>

          <Text style={styles.emailNote}>
            We will use it to contact you for future payment notices.
          </Text>
        </Card>

        {/* Buttons */}
        {editing && (
          <View style={styles.editButtonRow}>
            <Button mode="contained" onPress={handleSave}>
              Save
            </Button>
            <Button
              mode="outlined"
              onPress={() => {
                setEditing(false);
                setForm({ displayName: user.displayName, email: user.email });
              }}
              style={{ marginLeft: 8 }}
            >
              Cancel
            </Button>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    elevation: 1,
  },
  infoRow: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1e293b",
  },
  infoValue: {
    fontSize: 14,
    color: "#475569",
  },
  emailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  emailRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verified: {
    fontSize: 12,
    color: "green",
    fontWeight: "600",
  },
  emailValueRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  emailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
  },
  emailNote: {
    marginTop: 8,
    fontSize: 13,
    color: "#64748b",
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 14,
    paddingHorizontal: 0,
  },
  editButtonRow: {
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
});
