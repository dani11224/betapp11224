import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "../../../components/Brand";
import { useAuth } from "../../../contexts/Auth_contexts";
import { useData } from "@/contexts/data_contexts";
import { supabase } from "../../../utils/supabase";

type PublicProfile = {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url?: string | null;
};

export default function AddContact() {
  const { user } = useAuth();
  const { addChat } = useData();
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PublicProfile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const canSearch = useMemo(() => term.trim().length >= 2, [term]);

  const search = async () => {
    setError(null);
    if (!canSearch) {
      setResults([]);
      return;
    }
    setLoading(true);
    const q = term.trim();

    // Busca por username o name (puedes agregar email si lo expones)
    const { data, error } = await supabase
    .from("profiles")
    .select("id, username, name, avatar_url, email")
    .or(`username.ilike.%${q}%,name.ilike.%${q}%,email.ilike.%${q}%`)
    .neq("id", user?.id ?? "")   // no te muestres a ti mismo
    .limit(20);


    if (error) setError(error.message);
    setResults(
      (data ?? []).filter((p) => p.id !== user?.id) // evita mostrarte a ti mismo
    );
    setLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(search, 250); // debounce
    return () => clearTimeout(t);
  }, [term]);

    const handleCreateOrOpen = async (target: PublicProfile) => {
    const { chat, error } = await addChat(target.id);  // <- devuelve { chat, error }
    if (error || !chat) {
        setError(error ?? "Could not create/open chat.");
        return;
    }
    router.replace(`/main/chats/chat?id=${chat.id}`);   // <- usa chat.id
    // si migraste a ruta dinámica: router.replace(`/main/chats/${chat.id}`);
    };


  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Add contact</Text>
      </View>

      <View style={styles.container}>
        <View style={styles.searchRow}>
          <MaterialIcons name="search" size={20} color={palette.muted} />
          <TextInput
            placeholder="Search by username or name..."
            placeholderTextColor={palette.muted}
            style={styles.input}
            value={term}
            onChangeText={setTerm}
            autoFocus
          />
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator />
            <Text style={styles.muted}>Searching…</Text>
          </View>
        )}

        {!loading && error && (
          <Text style={[styles.muted, { color: "#f88" }]}>{error}</Text>
        )}

        {!loading && !error && canSearch && results.length === 0 && (
          <Text style={styles.muted}>No users found.</Text>
        )}

        <ScrollView contentContainerStyle={{ paddingVertical: 12 }}>
          {results.map((u) => {
            const title = u.username || u.name || u.id.slice(0, 6);
            return (
              <Pressable
                key={u.id}
                style={({ pressed }) => [styles.item, pressed && { opacity: 0.9 }]}
                onPress={() => handleCreateOrOpen(u)}
              >
                <View style={styles.avatar}>
                  <MaterialIcons name="person" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemTitle}>{title}</Text>
                  {u.name && u.username && (
                    <Text style={styles.itemSub}>{u.name} · @{u.username}</Text>
                  )}
                </View>
                <MaterialIcons name="chat" size={20} color={palette.muted} />
              </Pressable>
            );
          })}
          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, backgroundColor: palette.bg, paddingHorizontal: 16 },
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
  backBtn: { padding: 4, borderRadius: 8 },
  headerTitle: { color: palette.text, fontWeight: "800", fontSize: 18 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: "#16202b",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  input: { flex: 1, color: palette.text, fontSize: 15 },
  center: { alignItems: "center", marginTop: 16, gap: 6 },
  muted: { color: palette.muted, marginTop: 10 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 10,
    gap: 12,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: palette.accent, alignItems: "center", justifyContent: "center",
  },
  itemTitle: { color: palette.text, fontWeight: "800", fontSize: 15 },
  itemSub: { color: palette.muted, fontSize: 12, marginTop: 2 },
});
