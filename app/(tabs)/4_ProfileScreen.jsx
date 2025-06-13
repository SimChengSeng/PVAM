import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { Avatar, Text, Button, IconButton } from "react-native-paper";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../../config/FirebaseConfig";
import { getLocalStorage, removeLocalStorage } from "../../service/Storage";
import { Ionicons } from "@expo/vector-icons";

export default function ProfileScreen() {
  const [user, setUser] = useState({});
  const router = useRouter();

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
    router.replace("(auth)/LoginScreen");
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Avatar.Text
            size={60}
            label={user.displayName?.charAt(0) || "U"}
            style={{ backgroundColor: "#007aff" }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.displayName}>
            {user.displayName || "User Name"}
          </Text>
          <Text style={styles.phone}>
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

      {/* Quick stats */}
      {/* <View style={styles.cardRow}>
        <StatCard
          icon="star-circle-outline"
          title="Atome+"
          value="380 points"
        />
        <StatCard icon="email-outline" title="Messages" value="5 new" />
        <StatCard
          icon="ticket-percent-outline"
          title="Vouchers"
          value="19 available"
        />
      </View> */}

      {/* Manage Section */}
      <Section title="Manage">
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
        />
        <SettingItem icon="car-outline" label="Vehicle Usage" />
        <SettingItem icon="wrench-outline" label="Maintenance" />
        <SettingItem icon="cog-outline" label="Settings" />
      </Section>

      {/* Referral Section */}
      {/* <Section title="Referrals">
        <SettingItem icon="gift-outline" label="Refer a friend" />
      </Section> */}

      {/* Preference Section */}
      <Section title="Preference">
        <SettingItem icon="bookmark-outline" label="Saved" />
        <SettingItem icon="star-outline" label="Following" />
      </Section>

      {/* Support */}
      <Section title="Support">
        <SettingItem icon="chat-outline" label="Chat with us" />
        <SettingItem icon="logout" label="Logout" onPress={handleLogout} />
      </Section>
    </ScrollView>
  );
}

const StatCard = ({ icon, title, value }) => (
  <View style={styles.statCard}>
    <Avatar.Icon size={32} icon={icon} style={{ backgroundColor: "#eef2f7" }} />
    <Text style={styles.statTitle}>{title}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const Section = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View>{children}</View>
  </View>
);

const SettingItem = ({ icon, label, onPress }) => (
  <Pressable onPress={onPress} style={styles.settingItem}>
    <View style={styles.itemLeft}>
      <Avatar.Icon
        icon={icon}
        size={32}
        style={{ backgroundColor: "#f5f7fa" }}
        color="#1e293b"
      />
      <Text style={styles.settingLabel}>{label}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#fff",
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
    color: "#0f172a",
  },
  phone: {
    fontSize: 14,
    color: "#64748b",
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  statTitle: {
    fontSize: 12,
    color: "#475569",
    marginTop: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 8,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingLabel: {
    fontSize: 15,
    color: "#1e293b",
  },
  usefulBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  usefulText: {
    color: "#007bff",
    fontSize: 15,
    fontWeight: "bold",
  },
});
