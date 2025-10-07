import { useData } from "@/contexts/data_contexts";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView, Platform,
  Pressable,
  SafeAreaView, ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { palette } from "../../../components/Brand";
import { useAuth } from "../../../contexts/Auth_contexts";
import { supabase } from "../../../utils/supabase"; // 👈 importa supabase

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = Array.isArray(params.id) ? params.id[0] : params.id;
  const chatId = rawId && rawId !== "undefined" && rawId !== "null" ? rawId : null;

  const { chats, messages, fetchMessages, sendMessage, setCurrentChatId, addMessage } = useData(); // 👈 addMessage
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const chat = chatId ? chats.find((c) => c.id === chatId) : undefined;
  const myId = user?.id ?? "";
  const peer = chat ? (chat.user_id === myId ? chat.user2 : chat.user1) : undefined;

  const headerTitle =
    (peer?.name && peer.name.trim()) ||
    (peer?.username && peer.username.trim()) ||
    (chatId ? chatId.slice(0, 8) : "Chat");

  // Cargar mensajes + marcar chat abierto
  useEffect(() => {
    if (chatId) {
      setCurrentChatId(chatId);
      fetchMessages(chatId);
    }
    return () => setCurrentChatId(null);
  }, [chatId]);

  // 👇 Suscripción realtime SOLO a este chat, con filtro server-side
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`, // 🔥 clave
        },
        (payload) => {
          const msg = payload.new as any;
          addMessage(msg); // push local sin refetch
        }
      )
      .subscribe((status) => {
        if (__DEV__) console.log(`RT chat:${chatId} =>`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const chatMessages = chatId ? messages.filter((m) => m.chat_id === chatId) : [];

  const handleSend = async () => {
    if (!chatId) return;
    const text = input.trim();
    if (!text) return;
    await sendMessage(chatId, text);
    setInput("");
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </Pressable>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
        </View>

        {/* Mensajes */}
        <ScrollView
          style={styles.messages}
          contentContainerStyle={{ padding: 20, paddingBottom: 16 }}
          ref={scrollRef}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {chatMessages.map((msg) => {
            const when =
              msg?.created_at && !isNaN(new Date(msg.created_at).getTime())
                ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : "";
            return (
              <View
                key={msg.id}
                style={[
                  styles.bubble,
                  msg.sent_by === user?.id ? styles.bubbleMe : styles.bubbleOther,
                ]}
              >
                <Text style={styles.bubbleText}>{msg.text}</Text>
                <Text style={styles.bubbleTime}>{when}</Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Input */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={80}
        >
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={palette.muted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable style={styles.sendBtn} onPress={handleSend}>
              <MaterialIcons name="send" size={22} color="#fff" />
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, backgroundColor: palette.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.inputBg,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 10,
  },
  backBtn: { marginRight: 6, padding: 4, borderRadius: 8 },
  headerTitle: { color: palette.text, fontWeight: "800", fontSize: 18 },
  messages: { flex: 1, backgroundColor: palette.bg },
  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    alignSelf: "flex-start",
    backgroundColor: palette.inputBg,
  },
  bubbleMe: { alignSelf: "flex-end", backgroundColor: palette.accent },
  bubbleOther: { alignSelf: "flex-start", backgroundColor: palette.inputBg },
  bubbleText: { color: "#fff", fontSize: 15, fontWeight: "500" },
  bubbleTime: { color: palette.muted, fontSize: 11, marginTop: 4, textAlign: "right" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.inputBg,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    color: palette.text,
    fontSize: 15,
    backgroundColor: "#16202b",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: palette.accent,
    borderRadius: 10,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },
});