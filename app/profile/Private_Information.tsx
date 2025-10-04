// app/profile/info.tsx
import { AuroraBackground, Logo, palette } from "@/components/Brand";
import { AuthContext } from "@/contexts/Auth_contexts";
import { fetchMyProfile, type Profile } from "@/utils/profiles";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PersonalInfo() {
  const { user } = useContext(AuthContext);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const p = await fetchMyProfile(user.id);
      setProfile(p ?? null);
    } catch (e) {
      console.warn("fetchMyProfile error:", e);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);
  useFocusEffect(useCallback(() => { load(); }, [load])); // refresh when returning from edit

  const show = (v?: string | null) =>
    (typeof v === "string" && v.trim().length > 0) ? v : "Not set";

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AuroraBackground />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Logo />
            <Text style={styles.title}>Personal info</Text>
            <Text style={styles.muted}>ID: {user?.id ? user.id.slice(0, 8) : "—"}</Text>
          </View>

          {/* Foto de perfil */}
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }} // Asume que tienes el campo avatar_url en el perfil
                style={styles.avatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Text style={{ color: palette.muted, fontWeight: "700" }}>No photo</Text>
              </View>
            )}
          </View>

          {/* Card with all personal details */}
          <View style={styles.card}>
            {loading ? (
              <View style={{ paddingVertical: 10, alignItems: "center" }}>
                <ActivityIndicator color={palette.text} />
              </View>
            ) : (
              <>
                <Row label="Email" value={show(profile?.email ?? user?.email ?? null)} />
                <Row label="Username" value={show(profile?.username)} />
                <Row label="Name" value={show(profile?.name)} />
                <Row label="Phone" value={show(profile?.phone)} />
                <Row label="Location" value={show(profile?.location)} />
                <Row label="Website" value={show(profile?.website)} />
                <Row label="Birth date" value={show(profile?.birth_date)} />
                <Row label="Gender" value={show(profile?.gender)} />
                <Row label="Bio" value={show(profile?.bio)} multiline />
              </>
            )}

            <Pressable
                onPress={() => router.push("/main/profile")}
                style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.92 }]}
                >
                <Text style={styles.editBtnText}>Go Back</Text>
            </Pressable>

            <Pressable
              onPress={() => router.push("/profile/edit")}
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.92 }]}
            >
              <MaterialIcons name="edit" size={16} color="#fff" />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>

          {/* Meta (optional) */}
          {!loading && (
            <View style={styles.metaRow}>
              <MetaPill label="Verified" value={(profile?.is_verified ? "Yes" : "No") as string} />
              <MetaPill label="Points" value={String((profile as any)?.points ?? 0)} />
            </View>
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ---------- small pieces ---------- */
function Row({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[styles.rowValue, multiline && { lineHeight: 18 }]}
        numberOfLines={multiline ? 4 : 1}
      >
        {value}
      </Text>
    </View>
  );
}

function MetaPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaPill}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, paddingBottom: 32 },

  header: { alignItems: "center", marginBottom: 8 },
  title: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 6,
  },
  muted: { color: palette.muted },

  avatarContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: palette.border,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.inputBg,
    borderWidth: 2,
    borderColor: palette.border,
  },

  card: {
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    gap: 10,
  },

  row: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  rowLabel: { color: palette.muted, fontWeight: "700", width: 110 },
  rowValue: { color: palette.text, flex: 1, fontWeight: "700" },

  editBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: 6,
    backgroundColor: palette.accent,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  editBtnText: { color: "#fff", fontWeight: "800" },

  metaRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  metaPill: {
    flex: 1,
    backgroundColor: "#0f2a3c",
    borderWidth: 1,
    borderColor: "#18445c",
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  metaLabel: { color: "#cfe5f0", fontWeight: "700" },
  metaValue: { color: "#fff", fontWeight: "900", marginTop: 2 },
});
