import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Card,
  Appbar,
  useTheme,
} from "react-native-paper";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { useLocalSearchParams } from "expo-router";
import { db, auth } from "../../config/FirebaseConfig";
import { sendPushToUser } from "../../utils/notifications/sendPushToUser";

export default function DirectlyNotifyChatScreen() {
  const { messageId } = useLocalSearchParams();
  const [replies, setReplies] = useState([]);
  const [message, setMessage] = useState("");
  const [parentData, setParentData] = useState(null);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef();
  const theme = useTheme();

  useEffect(() => {
    const loadChat = async () => {
      const messageDoc = await getDoc(doc(db, "vehicleMessages", messageId));
      setParentData(messageDoc.exists() ? messageDoc.data() : null);
    };

    loadChat();
  }, [messageId]);

  useEffect(() => {
    if (!messageId) return;
    const q = query(
      collection(db, `vehicleMessages/${messageId}/replies`),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedReplies = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReplies(updatedReplies);
    });

    return () => unsubscribe();
  }, [messageId]);

  const handleSend = async () => {
    if (!messageId || !message.trim()) return;

    setSending(true); // disable button

    try {
      const reply = {
        senderId: auth.currentUser.uid,
        message,
        timestamp: Timestamp.now(),
      };

      await addDoc(
        collection(db, `vehicleMessages/${messageId}/replies`),
        reply
      );
      setMessage("");
      console.log("Test reply sent:", reply);
      // Only send push if recipient is not the current user and not actively viewing this chat

      // Determine recipient (the other participant)
      const recipientId =
        parentData?.senderId === auth.currentUser.uid
          ? parentData?.receiverId
          : parentData?.senderId;

      // Optionally: get activeChatId from context if you want to avoid sending if recipient is viewing this chat
      // const { activeChatId } = useAppContext();
      // if (recipientId && activeChatId !== messageId) { ... }

      if (recipientId) {
        const token = await getUserPushToken(recipientId);
        if (token) {
          await sendPushToUser({
            token,
            title: "You have a new reply",
            body: message,
            data: {
              screen: "NotificationInbox",
              messageId,
              plate: parentData.plateNumber,
            },
          });
        }
      }
    } catch (error) {
      console.error("Send failed", error);
    } finally {
      setSending(false); // re-enable button
    }
  };

  const getUserPushToken = async (userId) => {
    const tokenDoc = await getDoc(doc(db, "notificationTokens", userId));
    return tokenDoc.exists() ? tokenDoc.data()?.token : null;
  };

  const renderMessage = ({ item }) => {
    const isSender = item.senderId === auth.currentUser.uid;
    return (
      <View
        style={[
          styles.messageContainer,
          isSender ? styles.messageRight : styles.messageLeft,
        ]}
      >
        <Card
          style={[
            styles.messageCard,
            {
              backgroundColor: isSender
                ? theme.colors.primaryContainer
                : "#f0f0f0",
            },
          ]}
        >
          <Card.Content>
            <Text>{item.message}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp.seconds * 1000).toLocaleTimeString()}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Appbar.Header>
        <Appbar.Content
          title={parentData?.plateNumber ?? "Vehicle Chat"}
          subtitle="Direct Message"
        />
      </Appbar.Header>

      {parentData && (
        <Card style={styles.parentMessageCard}>
          <Card.Content>
            <Text style={styles.parentTitle}>
              {parentData.plateNumber} - Notification
            </Text>
            <Text>{parentData.message}</Text>
            <Text style={styles.timestamp}>
              {parentData.timestamp?.seconds
                ? new Date(parentData.timestamp.seconds * 1000).toLocaleString()
                : ""}
            </Text>
          </Card.Content>
        </Card>
      )}

      <FlatList
        ref={flatListRef}
        data={replies}
        keyExtractor={(item, index) => item.id ?? index.toString()}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 12 }}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      <View style={styles.inputBar}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type a message..."
          mode="outlined"
          style={styles.input}
        />
        <Button
          mode="contained"
          onPress={handleSend}
          style={styles.sendButton}
          disabled={sending || !message.trim()}
          loading={sending}
        >
          Send
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  sendButton: {
    paddingVertical: 6,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 10,
  },
  messageLeft: {
    justifyContent: "flex-start",
  },
  messageRight: {
    justifyContent: "flex-end",
  },
  messageCard: {
    maxWidth: "80%",
    borderRadius: 12,
    padding: 6,
  },
  timestamp: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
  },
  parentMessageCard: {
    margin: 12,
    borderRadius: 12,
    overflow: "hidden",
  },
  parentTitle: {
    fontWeight: "bold",
    marginBottom: 4,
  },
});
