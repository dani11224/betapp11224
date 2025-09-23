// app/profile/edit.tsx
import { AuroraBackground, Logo, palette } from "@/components/Brand";
import { AuthContext } from "@/contexts/Auth_contexts";
import { fetchMyProfile, saveMyProfile } from "@/utils/profiles";
import { supabase } from "@/utils/supabase";
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EditProfile() {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const params = useLocalSearchParams<{ avatarUri?: string | string[] }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local avatar preview
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

  // Editable fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        const p = await fetchMyProfile(user.id);
        if (p) {
          setName(p?.name ?? "");
          setUsername(p?.username ?? "");
          setBio(p?.bio ?? "");
          setWebsite(p?.website ?? "");
          setLocation(p?.location ?? "");
          setPhone(p?.phone ?? "");
          if (p?.avatar_url) setAvatarUri(p.avatar_url);
        } else {
          setName(user.user_metadata?.name ?? "");
        }
      } catch (e: any) {
        Alert.alert("Error", e.message ?? "Couldn't load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user?.id]);

  const applyAvatarFromParams = useCallback(() => {
    const rawParam = Array.isArray(params?.avatarUri) ? params.avatarUri[0] : params?.avatarUri;
    if (rawParam && typeof rawParam === "string") {
      try {
        setAvatarUri(decodeURIComponent(rawParam));
      } catch {
        setAvatarUri(rawParam);
      }
    }
  }, [params?.avatarUri]);

  useFocusEffect(
    useCallback(() => {
      applyAvatarFromParams();
    }, [applyAvatarFromParams])
  );

  const onSave = async () => {
    if (!user?.id) return;

    if (!name.trim()) {
      Alert.alert("Check your name", "Name cannot be empty.");
      return;
    }
    if (username.trim() && username.trim().length < 3) {
      Alert.alert("Check your username", "Username must be at least 3 characters.");
      return;
    }

    setSaving(true);
    try {
      let publicAvatarUrl: string | undefined = undefined;

      // Si viene de la cámara/galería será file://... → subimos a Storage
      if (avatarUri?.startsWith("file:")) {
        publicAvatarUrl = await uploadAvatar(user.id, avatarUri);
      } else if (avatarUri?.startsWith("http")) {
        publicAvatarUrl = avatarUri;
      }

      await saveMyProfile(user.id, {
        email: user.email ?? undefined,
        name: name.trim(),
        username: username.trim(),
        bio: bio.trim(),
        website: website.trim(),
        location: location.trim(),
        phone: phone.trim(),
        avatar_url: publicAvatarUrl,
      });

      router.replace("/main/profile");
    } catch (e: any) {
      console.log("saveMyProfile error:", e);
      Alert.alert("Save failed", e.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Sube un file://... a Supabase Storage (bucket: avatars) y devuelve la URL pública.
   * Usa ArrayBuffer; si no está disponible, hace fallback a FileSystem (base64 → ArrayBuffer).
   */
  const uploadAvatar = async (userId: string, localUri: string): Promise<string> => {
    // 1) Leer bytes
    let bytes: ArrayBuffer;

    try {
      // Intento preferido: fetch(...).arrayBuffer()
      const resp = await fetch(localUri);
      if (typeof resp.arrayBuffer === "function") {
        bytes = await resp.arrayBuffer();
      } else {
        // Fallback a FileSystem si arrayBuffer no existe
        const base64 = await FileSystem.readAsStringAsync(localUri, {
          encoding: "base64",
        });
        bytes = base64ToArrayBuffer(base64);
      }
    } catch {
      // Fallback robusto
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: "base64",
      });
      bytes = base64ToArrayBuffer(base64);
    }

    // 2) Determinar extension y contentType
    const ext = guessExt(localUri) ?? "jpg";
    const contentType = guessContentType(ext);

    // 3) Path dentro del bucket
    const filePath = `${userId}/${Date.now()}.${ext}`;

    // 4) Subir como ArrayBuffer
    const { error: uploadError } = await supabase
      .storage
      .from("avatars")
      .upload(filePath, bytes, {
        contentType,
        upsert: true,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.log("Upload error:", uploadError);
      throw uploadError;
    }

    // 5) Obtener URL pública
    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    const publicUrl = data?.publicUrl;
    if (!publicUrl) throw new Error("Could not get public URL for avatar.");
    return publicUrl;
  };

  const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
    const buf = Buffer.from(base64, "base64");
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  };

  const guessExt = (uri: string): "jpg" | "jpeg" | "png" | "webp" | undefined => {
    const name = uri.split("?")[0].split("#")[0];
    const m = name.match(/\.(jpg|jpeg|png|webp)$/i);
    return (m?.[1]?.toLowerCase() as any) || undefined;
  };

  const guessContentType = (ext: string): string => {
    switch (ext.toLowerCase()) {
      case "jpg":
      case "jpeg":
        return "image/jpeg";
      case "png":
        return "image/png";
      case "webp":
        return "image/webp";
      default:
        return "application/octet-stream";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AuroraBackground />
        <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
          <ActivityIndicator color={palette.text} />
          <Text style={{ color: palette.text, marginTop: 8 }}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Text style={styles.h1}>Edit profile</Text>
            <Text style={styles.muted}>ID: {user?.id ? user.id.slice(0, 8) : "—"}</Text>
          </View>

          {/* Avatar + button */}
          <View style={styles.avatarRow}>
            <View style={styles.avatarWrap}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={{ color: palette.muted, fontWeight: "700" }}>No photo</Text>
                </View>
              )}
            </View>
            <Pressable
              onPress={() => router.push("/profile/camera2")}
              style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.9 }]}
            >
              <Text style={styles.ghostText}>Change photo</Text>
            </Pressable>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Field label="Name">
              <Input value={name} onChangeText={setName} placeholder="Your name" />
            </Field>

            <Field label="Username">
              <Input
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                autoCapitalize="none"
              />
            </Field>

            <Field label="Bio">
              <Input
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us something…"
                multiline
              />
            </Field>

            <Field label="Website">
              <Input
                value={website}
                onChangeText={setWebsite}
                placeholder="https://…"
                autoCapitalize="none"
                keyboardType="url"
              />
            </Field>

            <Field label="Location">
              <Input value={location} onChangeText={setLocation} placeholder="City, Country" />
            </Field>

            <Field label="Phone">
              <Input
                value={phone}
                onChangeText={setPhone}
                placeholder="+57 ..."
                keyboardType="phone-pad"
              />
            </Field>

            <Pressable
              onPress={onSave}
              disabled={saving}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && { opacity: 0.95 },
                saving && { opacity: 0.7 },
              ]}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>Save changes</Text>
              )}
            </Pressable>
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ------- Subcomponents ------- */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      style={[styles.input, props.multiline && { height: 96, textAlignVertical: "top" }]}
      placeholderTextColor={palette.muted}
    />
  );
}

/* ---------------- Styles ---------------- */
const AVATAR_SIZE = 96;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, paddingBottom: 32 },

  header: { alignItems: "center", marginBottom: 12 },
  h1: { color: palette.text, fontSize: 18, fontWeight: "800", marginTop: 6 },
  muted: { color: palette.muted },

  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  avatarWrap: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: palette.border,
    backgroundColor: palette.inputBg,
  },
  avatar: { width: "100%", height: "100%" },
  avatarPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  ghostBtn: {
    backgroundColor: "#1a202c",
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ghostText: { color: palette.text, fontWeight: "700" },

  card: {
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 6,
  },

  label: { color: palette.muted, marginBottom: 6, fontWeight: "700" },
  input: {
    backgroundColor: palette.inputBg,
    color: palette.text,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },

  primaryBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
    backgroundColor: palette.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
});
