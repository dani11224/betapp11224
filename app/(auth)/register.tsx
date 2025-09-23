// app/(auth)/register.tsx
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

// ====== Paleta roja / neón ======
const BG = "#0F1115";
const BG_MID = "#171A22";
const BORDER = "#2A2F3C";
const TEXT = "#F4F6FB";
const MUTED = "#9AA3B2";
const RED = "#FF4D6D";           // primario
const RED_SOFT = "#FF7A90";      // brillo
const PINK_GLOW = "#FF91A8";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim()) return Alert.alert("Falta tu nombre");
    if (!email.trim()) return Alert.alert("Falta el email");
    if (password.length < 6) return Alert.alert("La contraseña debe tener 6+ caracteres");
    if (password !== confirm) return Alert.alert("Las contraseñas no coinciden");

    try {
      setLoading(true);

      // 1) Auth
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name.trim() } },
      });
      if (error) throw error;

      // 2) profiles (no rompe si ya existe por trigger)
      const user = data.user;
      if (user) {
        const { error: upsertErr } = await supabase
          .from("profiles")
          .upsert(
            {
              id: user.id,
              email: user.email,
              name: name.trim() || null,
            },
            { onConflict: "id" }
          );

        if (upsertErr) console.warn("profiles upsert error:", upsertErr);
      }

      Alert.alert(
        "Revisa tu correo",
        "Te enviamos un enlace para confirmar tu cuenta.",
        [{ text: "OK", onPress: () => router.replace("/(auth)/login") }]
      );
    } catch (e: any) {
      Alert.alert("No se pudo registrar", e?.message ?? "Intenta de nuevo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar barStyle="light-content" />
      {/* ==== “Cositos” (burbujas) decorativas ==== */}
      <View pointerEvents="none" style={styles.bubbleOne} />
      <View pointerEvents="none" style={styles.bubbleTwo} />
      <View pointerEvents="none" style={styles.bubbleThree} />

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>
          Regístrate y sincroniza tu perfil con Supabase.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Tu nombre"
            placeholderTextColor={MUTED}
            style={styles.input}
            autoCapitalize="words"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor={MUTED}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={MUTED}
              style={[styles.input, { flex: 1, paddingRight: 44 }]}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <Pressable style={styles.eye} onPress={() => setShowPass((s) => !s)}>
              <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color={MUTED} />
            </Pressable>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Confirmar contraseña</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repite tu contraseña"
            placeholderTextColor={MUTED}
            style={styles.input}
            secureTextEntry={!showPass}
            autoCapitalize="none"
          />
        </View>

        <Pressable
          onPress={handleRegister}
          disabled={loading}
          style={({ pressed }) => [
            styles.button,
            pressed && { transform: [{ scale: 0.99 }] },
            loading && { opacity: 0.7 },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={TEXT} />
          ) : (
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.replace("/(auth)/login")}
          style={{ marginTop: 16 }}
        >
          <Text style={{ color: MUTED, textAlign: "center" }}>
            ¿Ya tienes cuenta? <Text style={{ color: RED_SOFT }}>Inicia sesión</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 56,
  },
  title: {
    color: TEXT,
    fontSize: 30,
    fontWeight: "800",
    marginBottom: 6,
    textShadowColor: PINK_GLOW,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    color: MUTED,
    marginBottom: 20,
  },
  field: {
    marginBottom: 14,
  },
  label: {
    color: MUTED,
    marginBottom: 8,
  },
  input: {
    backgroundColor: BG_MID,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: TEXT,
    fontSize: 16,
  },
  passwordWrap: {
    position: "relative",
    justifyContent: "center",
  },
  eye: {
    position: "absolute",
    right: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  button: {
    backgroundColor: RED,
    paddingVertical: 14,
    borderRadius: 18,
    alignItems: "center",
    marginTop: 8,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: "#FF264F33",
  },
  buttonText: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  // === Burbujas ("cositos") ===
  bubbleOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "#FF29444D",
    top: -40,
    right: -60,
    shadowColor: RED,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 40,
  },
  bubbleTwo: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: "#FF6B6B33",
    bottom: 80,
    left: -40,
    shadowColor: PINK_GLOW,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 30,
  },
  bubbleThree: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 999,
    backgroundColor: "#FF91A81F",
    bottom: 180,
    right: 24,
    shadowColor: "#FF91A8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },
});
