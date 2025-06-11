import React, { useEffect, useState } from "react";
import { View, FlatList, Pressable } from "react-native";
import {
  Card,
  Text,
  Divider,
  Button,
  ActivityIndicator,
  Dialog,
  Portal,
} from "react-native-paper";
import {
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../../config/FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "expo-router";

export default function DirectlyNotifyInboxScreen() {
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const [viewedMessages, setViewedMessages] = useState({});
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedToDelete, setSelectedToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setMessages([]);
      }
    });
    return () => unsubscribeAuth();
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

  const handleDeleteMessage = async () => {
    try {
      if (!selectedToDelete) return;

      const messageRef = doc(db, "vehicleMessages", selectedToDelete);
      const repliesRef = collection(
        db,
        "vehicleMessages",
        selectedToDelete,
        "replies"
      );

      // 1. Get all reply docs
      const repliesSnapshot = await getDocs(repliesRef);

      // 2. Create batch to delete all replies
      const batch = writeBatch(db);
      repliesSnapshot.forEach((replyDoc) => {
        batch.delete(replyDoc.ref);
      });

      // 3. Delete parent message document
      batch.delete(messageRef);

      // 4. Commit all deletions
      await batch.commit();

      setDeleteDialogVisible(false);
      setSelectedToDelete(null);
      console.log("Message and replies deleted.");
    } catch (error) {
      console.error("Failed to delete message with replies:", error);
    }
  };

  const confirmDelete = (id) => {
    setSelectedToDelete(id);
    setDeleteDialogVisible(true);
  };

  const renderMessageItem = ({ item }) => {
    const currentUserId = auth.currentUser?.uid;
    const hasRead = !!item.readStatus?.[currentUserId];
    const viewed = viewedMessages[item.id];

    return (
      <Card mode="outlined" style={{ marginHorizontal: 12, marginVertical: 6 }}>
        <Pressable
          android_ripple={{ color: "#eee" }}
          onPress={() => handleViewMessage(item.id)}
        >
          <Card.Title
            title={
              <Text
                numberOfLines={1}
                style={{
                  color: hasRead ? "#888" : "#000",
                  fontWeight: hasRead ? "normal" : "bold",
                }}
              >
                {item.title || "Untitled Notification"}
              </Text>
            }
            subtitle={
              item.timestamp?.toDate
                ? new Date(item.timestamp.toDate()).toLocaleString()
                : ""
            }
          />
          <Card.Content>
            <Text numberOfLines={2} style={{ marginBottom: 6 }}>
              {item.message || "No content available."}
            </Text>
          </Card.Content>
        </Pressable>

        {viewed && (
          <Card.Actions style={{ justifyContent: "flex-end" }}>
            <Button
              icon="delete-outline"
              mode="contained-tonal"
              onPress={() => confirmDelete(item.id)}
            >
              Delete
            </Button>
          </Card.Actions>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator animating={true} size="large" />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessageItem}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={
          <View style={{ padding: 30, alignItems: "center" }}>
            <Text style={{ color: "#999", fontSize: 16 }}>
              You have no notifications
            </Text>
          </View>
        }
      />
      <Portal>
        <Dialog
          visible={deleteDialogVisible}
          onDismiss={() => setDeleteDialogVisible(false)}
        >
          <Dialog.Title>Delete Message</Dialog.Title>
          <Dialog.Content>
            <Text>Are you sure you want to delete this message?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialogVisible(false)}>
              Cancel
            </Button>
            <Button onPress={handleDeleteMessage}>Delete</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
