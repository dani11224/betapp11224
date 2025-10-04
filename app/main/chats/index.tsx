import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuroraBackground, palette } from "../../../components/Brand";
import { useAuth } from "../../../contexts/Auth_contexts";
import { useData } from "@/contexts/data_contexts";

export default function ChatsIndex() {
  const data = useData();
  const chatsList = Array.isArray(data?.chats) ? data.chats : [];
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AuroraBackground />

        <View style={styles.headerRow}>
          <Text style={styles.title}>Chats</Text>
          <Pressable
            style={styles.addBtn}
            onPress={() => {
              router.push("/main/chats/addContact");
            }}
          >
            <MaterialIcons name="person-add" size={22} color="#fff" />
            <Text style={styles.addBtnText}>Add</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {chatsList.length === 0 && (
            <Text style={{ color: palette.muted, textAlign: "center", marginTop: 32 }}>
              No chats yet.
            </Text>
          )}

          {chatsList.map((chat: any) => {
            const currentId = user?.id ?? "";

            // 👇 Si yo soy user_id, el “otro” es user2; si no, es user1
            const peer = chat?.user_id === currentId ? chat?.user2 : chat?.user1;

            // Fallback al UUID por si el perfil aún no cargó
            const otherId = chat?.user_id === currentId ? chat?.user_id2 : chat?.user_id;

            const chatName =
              (peer?.name && String(peer.name).trim()) ||
              (peer?.username && String(peer.username).trim()) ||
              (otherId ? String(otherId).slice(0, 8) : "Unknown");

            const updated = chat?.updated_at ? new Date(chat.updated_at) : null;
            const timeStr =
              updated && !isNaN(updated.getTime())
                ? updated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";

            return (
              <Pressable
                key={String(chat?.id ?? `${chat?.user_id}-${chat?.user_id2}`)}
                style={({ pressed }) => [styles.chatCard, pressed && { opacity: 0.9 }]}
                onPress={() => router.push(`/main/chats/chat?id=${chat?.id}`)}
              >
                <View style={styles.avatarCircle}>
                  <MaterialIcons name="person" size={28} color="#fff" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.chatName}>{chatName}</Text>
                  {/* <Text style={styles.lastMessage} numberOfLines={1}>{chat.lastMessage}</Text> */}
                </View>

                <Text style={styles.time}>{timeStr}</Text>
              </Pressable>
            );
          })}

          <View style={{ height: 28 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, backgroundColor: palette.bg },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    marginBottom: 8,
  },
  title: {
    color: palette.text,
    fontSize: 22,
    fontWeight: "800",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.accent,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
    gap: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  chatName: {
    color: palette.text,
    fontWeight: "800",
    fontSize: 16,
  },
  lastMessage: {
    color: palette.muted,
    fontSize: 13,
    marginTop: 2,
  },
  time: {
    color: palette.muted,
    fontSize: 12,
    marginLeft: 8,
    fontWeight: "700",
  },
});
