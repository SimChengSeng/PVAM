import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  View,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
} from "react-native";
import {
  TextInput,
  Button,
  Text,
  Card,
  Appbar,
  useTheme,
  Provider,
  Dialog,
  Portal,
} from "react-native-paper";
import {
  collection,
  addDoc,
  getDoc,
  doc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
  setDoc,
  getDocs,
  writeBatch,
  deleteDoc,
} from "firebase/firestore";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db, auth } from "../../config/FirebaseConfig";
import { sendPushToUser } from "../../utils/notifications/sendPushToUser";

export default function DirectlyNotifyChatScreen() {
  const { messageId } = useLocalSearchParams();
  const [replies, setReplies] = useState([]);
  const [message, setMessage] = useState("");
  const [parentData, setParentData] = useState(null);
  const [sending, setSending] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [loadingDelete, setLoadingDelete] = useState(false);
  const flatListRef = useRef();
  const theme = useTheme();
  const router = useRouter();

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

  useEffect(() => {
    const markAsRead = async () => {
      const currentUserId = auth.currentUser?.uid;
      if (!messageId || !currentUserId) return;

      try {
        const messageRef = doc(db, "vehicleMessages", messageId);
        await setDoc(
          messageRef,
          {
            readStatus: {
              [currentUserId]: Timestamp.now(),
            },
          },
          { merge: true }
        );
      } catch (error) {
        console.error("Failed to mark as read:", error);
      }
    };

    markAsRead();
  }, [messageId]);

  const handleSend = async () => {
    if (!messageId || !message.trim()) return;

    setSending(true);

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
      const recipientId =
        parentData?.senderId === auth.currentUser.uid
          ? parentData?.receiverId
          : parentData?.senderId;

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
      setSending(false);
    }
  };

  const getUserPushToken = async (userId) => {
    const tokenDoc = await getDoc(doc(db, "notificationTokens", userId));
    return tokenDoc.exists() ? tokenDoc.data()?.token : null;
  };

  // Delete message and all replies
  const handleDeleteMessage = async () => {
    setLoadingDelete(true);
    try {
      const messageRef = doc(db, "vehicleMessages", messageId);
      const repliesRef = collection(
        db,
        "vehicleMessages",
        messageId,
        "replies"
      );
      const repliesSnapshot = await getDocs(repliesRef);
      const batch = writeBatch(db);
      repliesSnapshot.forEach((replyDoc) => {
        batch.delete(replyDoc.ref);
      });
      batch.delete(messageRef);
      await batch.commit();
      setDeleteDialogVisible(false);
      router.back();
    } catch (error) {
      Alert.alert("Delete Failed", error.message || "Unable to delete.");
    }
    setLoadingDelete(false);
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
                : theme.colors.surface,
              borderWidth: 1,
              borderColor: isSender
                ? theme.colors.primary
                : theme.colors.outlineVariant || "#e0e0e0",
            },
          ]}
        >
          <Card.Content>
            <Text style={{ color: theme.colors.onSurface }}>
              {item.message}
            </Text>
            <Text
              style={[
                styles.timestamp,
                { color: theme.colors.onSurfaceVariant },
              ]}
            >
              {item.timestamp?.seconds
                ? new Date(item.timestamp.seconds * 1000).toLocaleTimeString()
                : ""}
            </Text>
          </Card.Content>
        </Card>
      </View>
    );
  };

  return (
    <Provider>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
          <Appbar.Content
            title={parentData?.plateNumber ?? "Vehicle Chat"}
            subtitle="Direct Message"
            titleStyle={{ color: theme.colors.primary }}
            subtitleStyle={{ color: theme.colors.onSurfaceVariant }}
          />
          {/* Delete button in the header */}
          <Appbar.Action
            icon="delete-outline"
            color={theme.colors.error}
            onPress={() => setDeleteDialogVisible(true)}
            accessibilityLabel="Delete conversation"
          />
        </Appbar.Header>

        {parentData && (
          <Card
            style={[
              styles.parentMessageCard,
              { backgroundColor: theme.colors.surface },
            ]}
          >
            <Card.Content>
              <Text
                style={[styles.parentTitle, { color: theme.colors.primary }]}
              >
                {parentData.plateNumber} - Notification
              </Text>
              <Text style={{ color: theme.colors.onSurface }}>
                {parentData.message}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {parentData.timestamp?.seconds
                  ? new Date(
                      parentData.timestamp.seconds * 1000
                    ).toLocaleString()
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

        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.outlineVariant || "#ddd",
            },
          ]}
        >
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Type a message..."
            mode="outlined"
            style={[styles.input, { backgroundColor: theme.colors.surface }]}
            theme={{
              colors: {
                primary: theme.colors.primary,
                text: theme.colors.onSurface,
                placeholder: theme.colors.onSurfaceVariant,
                background: theme.colors.surface,
              },
            }}
            textColor={theme.colors.onSurface}
            placeholderTextColor={theme.colors.onSurfaceVariant}
          />
          <Button
            mode="contained"
            onPress={handleSend}
            style={[
              styles.sendButton,
              { backgroundColor: theme.colors.primary },
            ]}
            disabled={sending || !message.trim()}
            loading={sending}
            labelStyle={{ color: theme.colors.onPrimary }}
          >
            Send
          </Button>
        </View>

        {/* Delete confirmation dialog */}
        <Portal>
          <Dialog
            visible={deleteDialogVisible}
            onDismiss={() => setDeleteDialogVisible(false)}
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Dialog.Title style={{ color: theme.colors.primary }}>
              Delete Conversation
            </Dialog.Title>
            <Dialog.Content>
              <Text style={{ color: theme.colors.onSurface }}>
                Are you sure you want to delete this message and its replies?
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeleteDialogVisible(false)}>
                Cancel
              </Button>
              <Button
                onPress={handleDeleteMessage}
                textColor={theme.colors.error}
                loading={loadingDelete}
              >
                Delete
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </KeyboardAvoidingView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    marginRight: 8,
  },
  sendButton: {
    paddingVertical: 6,
    borderRadius: 8,
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
    elevation: 1,
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
  },
  parentMessageCard: {
    margin: 12,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 1,
  },
  parentTitle: {
    fontWeight: "bold",
    marginBottom: 4,
    fontSize: 15,
  },
});
