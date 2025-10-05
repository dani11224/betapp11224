// app/main/admin/create-bet.tsx
import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { createBetWithOptions } from "@/app/admin/bets"; // ⬅️ ajusta a tu helper real
import { AuroraBackground, Logo, palette } from "@/components/Brand";
import { supabase } from "@/utils/supabase"; // ⬅️ ajusta si tu cliente está en otra ruta

export default function CreateBetScreen() {
  const [title, setTitle] = useState("");
  const [description, setDesc] = useState("");
  const [baseCost, setBaseCost] = useState("0");
  const [stakeMin, setStakeMin] = useState("0");
  const [stakeMax, setStakeMax] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [options, setOptions] = useState<{ label: string; odds: number }[]>([
    { label: "", odds: 1.0 },
    { label: "", odds: 1.0 },
  ]);
  const [busy, setBusy] = useState(false);

  // Guard: solo ADMIN
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) { router.replace("/(auth)/login"); return; }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", uid)
        .maybeSingle();

      if (!mounted) return;
      if (error || !data || String(data.role) !== "ADMIN") {
        Alert.alert("Access denied", "Admins only.");
        router.back();
      }
    })();
    return () => { mounted = false; };
  }, []);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ allowsEditing: true, quality: 0.8 });
    if (!res.canceled) setImageUri(res.assets[0].uri);
  };

  const save = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a title.");
      return;
    }
    setBusy(true);
    try {
      const betId = await createBetWithOptions(
        {
          title,
          description,
          baseCost: Number(baseCost),
          stakeMin: Number(stakeMin),
          stakeMax: stakeMax ? Number(stakeMax) : null,
          opensAt: null,
          closesAt: null,
        },
        options
          .map(o => ({ label: o.label.trim(), odds: Number(o.odds) }))
          .filter(o => o.label),
        imageUri
      );
      Alert.alert("Success", `Bet created: ${betId}`);
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not create bet");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <AuroraBackground />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Logo />
          <Text style={styles.title}>Create bet</Text>
          <Text style={styles.subtitle}>Define details, options and an image</Text>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <FormRow label="Title">
            <Input value={title} onChangeText={setTitle} placeholder="Match 1X2 - Team A vs Team B" />
          </FormRow>

          <FormRow label="Description">
            <Input
              value={description}
              onChangeText={setDesc}
              placeholder="Optional description…"
              multiline
              style={{ height: 100, textAlignVertical: "top" }}
            />
          </FormRow>

          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <FormRow label="Base cost">
                <Input value={baseCost} onChangeText={setBaseCost} keyboardType="numeric" placeholder="0" />
              </FormRow>
            </View>
            <View style={{ width: 10 }} />
            <View style={{ flex: 1 }}>
              <FormRow label="Stake min">
                <Input value={stakeMin} onChangeText={setStakeMin} keyboardType="numeric" placeholder="0" />
              </FormRow>
            </View>
          </View>

          <FormRow label="Stake max (optional)">
            <Input value={stakeMax} onChangeText={setStakeMax} keyboardType="numeric" placeholder="e.g. 200000" />
          </FormRow>

          {/* Options */}
          <Text style={styles.section}>Options</Text>
          {options.map((o, i) => (
            <View key={i} style={styles.optionCard}>
              <Input
                value={o.label}
                onChangeText={(t) => {
                  const next = [...options]; next[i] = { ...o, label: t }; setOptions(next);
                }}
                placeholder={`Option ${i + 1} label`}
                style={{ marginBottom: 8 }}
              />
              <Input
                value={String(o.odds)}
                onChangeText={(t) => {
                  const next = [...options]; next[i] = { ...o, odds: Number(t || 0) }; setOptions(next);
                }}
                keyboardType="numeric"
                placeholder="Odds (e.g., 1.85)"
              />
              <Pressable
                onPress={() => setOptions(options.filter((_, idx) => idx !== i))}
                style={({ pressed }) => [styles.ghostBtnSmall, pressed && { opacity: 0.9 }]}
              >
                <MaterialIcons name="remove-circle-outline" size={18} color={palette.muted} />
                <Text style={styles.ghostBtnSmallText}>Remove</Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            onPress={() => setOptions([...options, { label: "", odds: 1 }])}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}
          >
            <MaterialIcons name="add" size={18} color={palette.text} />
            <Text style={styles.secondaryBtnText}>Add option</Text>
          </Pressable>

          {/* Image */}
          <Text style={styles.section}>Image</Text>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <Text style={styles.hint}>No image selected</Text>
          )}

          <Pressable onPress={pickImage} style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.9 }]}>
            <MaterialIcons name="image" size={18} color={palette.text} />
            <Text style={styles.secondaryBtnText}>Pick image</Text>
          </Pressable>

          {/* Actions */}
          <View style={{ height: 8 }} />
          <Pressable
            onPress={save}
            disabled={busy}
            style={({ pressed }) => [styles.primaryBtn, (pressed || busy) && { opacity: 0.9 }]}
          >
            <MaterialIcons name="check-circle" size={18} color="#fff" />
            <Text style={styles.primaryBtnText}>{busy ? "Creating..." : "Create bet"}</Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.9 }]}
          >
            <MaterialIcons name="arrow-back" size={18} color={palette.muted} />
            <Text style={styles.ghostBtnText}>Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ---------- Small UI helpers to match Profile styles ---------- */

function FormRow({ label, children }: { label: string; children: React.ReactNode }) {
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
      placeholderTextColor={palette.muted}
      style={[styles.input, props.style as any]}
    />
  );
}

/* ---------- Styles (neon/dark to match profile) ---------- */

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, paddingBottom: 40 },

  header: { alignItems: "center", marginBottom: 10 },
  title: { color: palette.text, fontSize: 18, fontWeight: "800", marginTop: 4 },
  subtitle: { color: palette.muted, fontSize: 12 },

  card: {
    backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 18, padding: 14, marginTop: 12,
  },

  label: { color: palette.muted, fontWeight: "700", marginBottom: 6 },

  input: {
    backgroundColor: "#0e1b26",
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    color: palette.text,
  },

  row2: { flexDirection: "row" },

  section: {
    color: palette.text, fontSize: 16, fontWeight: "800",
    marginTop: 6, marginBottom: 10,
  },

  optionCard: {
    backgroundColor: "#0f2a3c",
    borderWidth: 1, borderColor: "#18445c",
    borderRadius: 14, padding: 12, marginBottom: 10,
  },

  preview: {
    width: "100%", height: 200, borderRadius: 12,
    borderWidth: 1, borderColor: palette.border, marginBottom: 10,
  },

  hint: { color: palette.muted, marginBottom: 6 },

  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: palette.accent, paddingVertical: 12, borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  secondaryBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, alignSelf: "flex-start",
    marginBottom: 8,
  },
  secondaryBtnText: { color: palette.text, fontWeight: "800" },

  ghostBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 10, borderRadius: 12, marginTop: 8,
  },
  ghostBtnText: { color: palette.muted, fontWeight: "800" },

  ghostBtnSmall: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", marginTop: 8,
    paddingVertical: 6, paddingHorizontal: 10,
    borderRadius: 10, borderWidth: 1, borderColor: "#18445c",
  },
  ghostBtnSmallText: { color: palette.muted, fontWeight: "700" },
});
