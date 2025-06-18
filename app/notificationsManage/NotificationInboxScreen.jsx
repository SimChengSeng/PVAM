import React, { useEffect, useState } from "react";
import { FlatList, View } from "react-native";
import { Text, Card, useTheme, Divider } from "react-native-paper";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../../config/FirebaseConfig";
import DirectlyNotifyInboxScreen from "../directlyNotify/DirectlyNotifyInboxScreen";

export default function NotificationInboxScreen() {
  const [notifications, setNotifications] = useState([]);
  const theme = useTheme();

  useEffect(() => {
    const q = query(
      collection(db, "appNotifications"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      ListHeaderComponent={
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginHorizontal: 12,
            marginTop: 24,
            marginBottom: 10,
            color: theme.colors.onSurface,
          }}
        >
          App Notifications
        </Text>
      }
      data={notifications}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Card
          mode="outlined"
          style={{
            marginHorizontal: 12,
            marginVertical: 6,
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.outlineVariant,
          }}
        >
          <Card.Title
            title={item.title}
            subtitle={new Date(item.createdAt?.toDate()).toLocaleString()}
            subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          <Card.Content>
            <Text style={{ color: theme.colors.onSurface }}>
              {item.body || "No content"}
            </Text>
          </Card.Content>
        </Card>
      )}
      ListEmptyComponent={
        <View style={{ padding: 30, alignItems: "center" }}>
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            No notifications found
          </Text>
        </View>
      }
      ItemSeparatorComponent={() => <Divider />}
      ListFooterComponent={
        <View style={{ marginTop: 24 }}>
          <DirectlyNotifyInboxScreen />
        </View>
      }
    />
  );
}
