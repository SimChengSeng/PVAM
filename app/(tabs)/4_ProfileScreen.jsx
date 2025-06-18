import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Pressable, Alert } from "react-native";
import { Avatar, Text, IconButton, useTheme } from "react-native-paper";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../../config/FirebaseConfig";
import { getLocalStorage, removeLocalStorage } from "../../service/Storage";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const [user, setUser] = useState({});
  const router = useRouter();
  const theme = useTheme();

  useEffect(() => {
    const loadUser = async () => {
      const userData = await getLocalStorage("userDetail");
      setUser(userData || {});
    };
    loadUser();
  }, []);

  // Update handleLogout to show a confirmation dialog
  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await signOut(auth);
            await removeLocalStorage();
            router.replace("(auth)/LoginScreen");
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 120 }]}
      >
        {/* Header */}
        <View
          style={[styles.header, { paddingHorizontal: 10, paddingTop: 50 }]}
        >
          <View style={styles.avatarContainer}>
            <Avatar.Text
              size={60}
              label={user.displayName?.charAt(0) || "U"}
              style={{ backgroundColor: theme.colors.primary }}
              color={theme.colors.onPrimary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.displayName, { color: theme.colors.onBackground }]}
            >
              {user.displayName || "User Name"}
            </Text>
            <Text style={[styles.phone, { color: theme.colors.outline }]}>
              {user.phoneNumber
                ? `+60 •••• ••${user.phoneNumber?.slice(-3)}`
                : user.email}
            </Text>
          </View>
          <IconButton
            icon="chevron-right"
            onPress={() => router.push("/profileManage/EditProfileScreen")}
          />
        </View>

        {/* Manage Section */}
        <Section title="Manage" theme={theme}>
          <SettingItem
            icon="steering"
            label="Driving Behavior"
            onPress={() =>
              router.push({
                pathname:
                  "/profileManage/DrivingBehaviorForm/DrivingLevelEstimationForm",
                params: { userEmail: user.email },
              })
            }
            theme={theme}
          />
          <SettingItem icon="car-outline" label="Vehicle Usage" theme={theme} />
          <SettingItem
            icon="wrench-outline"
            label="Maintenance"
            theme={theme}
          />
          <SettingItem
            icon="cog-outline"
            label="Settings"
            onPress={() =>
              router.push({
                pathname: "/profileManage/settings/SettingsScreen",
                params: { userEmail: user.email },
              })
            }
            theme={theme}
          />
        </Section>

        <Section title="Preference" theme={theme}>
          <SettingItem icon="bookmark-outline" label="Saved" theme={theme} />
          <SettingItem icon="star-outline" label="Following" theme={theme} />
        </Section>

        <Section title="Support" theme={theme}>
          <SettingItem icon="chat-outline" label="Chat with us" theme={theme} />
        </Section>

        <Section title="About" theme={theme}>
          <SettingItem
            icon="information-outline"
            label="About Us"
            theme={theme}
          />
          <SettingItem
            icon="shield-outline"
            label="Privacy Policy"
            theme={theme}
          />
        </Section>

        <View style={styles.logoutWrapper}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutButton,
              {
                backgroundColor: theme.colors.error,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name="log-out-outline"
              size={20}
              color={theme.colors.onPrimary}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[styles.logoutText, { color: theme.colors.onPrimary }]}
            >
              Logout
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const Section = ({ title, children, theme }) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>
      {title}
    </Text>
    <View>{children}</View>
  </View>
);

const SettingItem = ({ icon, label, onPress, theme }) => (
  <Pressable onPress={onPress} style={styles.settingItem}>
    <View style={styles.itemLeft}>
      <Avatar.Icon
        icon={icon}
        size={32}
        style={{ backgroundColor: theme.colors.surfaceVariant }}
        color={theme.colors.primary}
      />
      <Text style={[styles.settingLabel, { color: theme.colors.onSurface }]}>
        {label}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color={theme.colors.outline} />
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 12,
  },
  displayName: {
    fontSize: 20,
    fontWeight: "bold",
  },
  phone: {
    fontSize: 14,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
  },
  logoutWrapper: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 24,
    backgroundColor: "#fee2e2", // fallback for light mode
    elevation: 2,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
