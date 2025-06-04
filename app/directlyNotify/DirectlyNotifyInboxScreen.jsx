// screens/NotificationInboxScreen.jsx
import React, { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../config/FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "expo-router";

export default function DirectlyNotifyInboxScreen() {
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
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
    });
    return unsub;
  }, [userId]);

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable
          onPress={() =>
            router.push({
              pathname: "directlyNotify/DirectlyNotifyChatScreen",
              params: { messageId: item.id },
            })
          }
        >
          <View style={{ padding: 15, borderBottomWidth: 1 }}>
            <Text style={{ fontWeight: "bold" }}>{item.title}</Text>
            <Text>{item.message}</Text>
            <Text>
              {item.timestamp?.toDate
                ? new Date(item.timestamp.toDate()).toLocaleString()
                : ""}
            </Text>
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        <View style={{ padding: 30, alignItems: "center" }}>
          <Text style={{ color: "#999", fontSize: 16 }}>
            You have no notifications
          </Text>
        </View>
      }
    />
  );
}
