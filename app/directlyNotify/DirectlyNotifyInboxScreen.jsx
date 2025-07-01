import React, { useEffect, useState } from "react";
import { View, FlatList, Pressable, StyleSheet, Alert } from "react-native";
import {
  Card,
  Text,
  Divider,
  Button,
  ActivityIndicator,
  Dialog,
  Portal,
  useTheme,
  Provider,
  Avatar,
  Badge,
} from "react-native-paper";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../../config/FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import { globalStyles, getThemedStyles } from "../../styles/globalStyles";

export default function DirectlyNotifyInboxScreen() {
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [viewedMessages, setViewedMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUserId(user?.uid ?? null);
      if (!user) setMessages([]);
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "vehicleMessages"),
      where("participants", "array-contains", userId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsub;
  }, [userId]);

  const handleViewMessage = (id) => {
    setViewedMessages((prev) => ({ ...prev, [id]: true }));
    router.push({
      pathname: "directlyNotify/DirectlyNotifyChatScreen",
      params: { messageId: id },
    });
  };

  const renderMessageItem = ({ item }) => {
    const currentUserId = auth.currentUser?.uid;
    const hasRead = !!item.readStatus?.[currentUserId];
    const viewed = viewedMessages[item.id];

    const timestamp =
      item.timestamp?.toDate?.() || new Date(item.timestamp ?? Date.now());
    const relativeTime = formatDistanceToNow(timestamp, { addSuffix: true });

    return (
      <Pressable onPress={() => handleViewMessage(item.id)}>
        <Card
          mode="outlined"
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant,
            },
          ]}
        >
          <Card.Title
            title={item.title || "Untitled Notification"}
            subtitle={relativeTime}
            left={(props) => (
              <Avatar.Text
                {...props}
                label={(item.title || "N")[0].toUpperCase()}
                style={{
                  backgroundColor: hasRead
                    ? theme.colors.secondaryContainer
                    : theme.colors.primary,
                }}
                color={
                  hasRead
                    ? theme.colors.onSecondaryContainer
                    : theme.colors.onPrimary
                }
              />
            )}
            right={() =>
              !hasRead && (
                <Badge
                  size={12}
                  style={{
                    backgroundColor: theme.colors.error,
                    marginRight: 12,
                  }}
                />
              )
            }
            titleStyle={{
              fontWeight: hasRead ? "normal" : "bold",
              color: hasRead ? theme.colors.onSurface : theme.colors.primary,
            }}
            subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          <Card.Content style={{ paddingTop: 0 }}>
            <Text numberOfLines={2} style={{ color: theme.colors.onSurface }}>
              {item.message || "No content available."}
            </Text>
          </Card.Content>
        </Card>
      </Pressable>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator
          animating={true}
          size="large"
          color={theme.colors.primary}
        />
      </View>
    );
  }

  return (
    <Provider>
      <View
        style={{
          ...styles.container,
          backgroundColor: theme.colors.background,
        }}
      >
        <Text
          style={{
            ...styles.title,
            color: theme.colors.onSurface,
          }}
        >
          Inbox
        </Text>
        <FlatList
          style={{ backgroundColor: theme.colors.background }}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessageItem}
          ItemSeparatorComponent={() => <Divider />}
          contentContainerStyle={messages.length === 0 && styles.emptyPadding}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                You have no notifications
              </Text>
            </View>
          }
        />
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  card: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 12,
    marginBottom: 10,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    padding: 30,
    alignItems: "center",
  },
  emptyPadding: {
    flexGrow: 1,
    justifyContent: "center",
  },
});
