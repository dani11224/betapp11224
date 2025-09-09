// app/Cambiar_contra.tsx
import { Link, router } from "expo-router";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { AuroraBackground, Logo, palette } from "../../components/Brand";

export default function Cambiar_contra() {
  const [step, setStep] = useState<"request" | "reset">("request");
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);

  const emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passOK = pass.length >= 8;
  const same = pass === pass2;
  const codeOK = code.trim().length >= 4;

  const sendCode = async () => {
    if (!emailOK) return;
    setLoading(true);
    // TODO: llama a tu API para enviar código de verificación
    setTimeout(() => {
      setLoading(false);
      setStep("reset"); // simulamos que el código fue enviado
    }, 900);
  };

  const changePassword = async () => {
    if (!(passOK && same && codeOK)) return;
    setLoading(true);
    // TODO: llama a tu API para confirmar código y actualizar contraseña
    setTimeout(() => {
      setLoading(false);
      router.replace("/(auth)/login"); // vuelve al login
    }, 900);
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <Logo />

      <View style={styles.form}>
        {step === "request" ? (
          <>
            <Text style={styles.subtitle}>Recover your account</Text>
            <Text style={styles.helper}>
              Enter your email and we’ll send you a verification code.
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#89a7b6"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Pressable
              onPress={sendCode}
              disabled={!emailOK || loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                (pressed || loading) && styles.primaryBtnPressed,
                (!emailOK || loading) && styles.btnDisabled,
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? "Sending..." : "Send code"}
              </Text>
            </Pressable>

            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={{ marginTop: 14 }}>
                <Text style={styles.linkText}>Back to login</Text>
              </TouchableOpacity>
            </Link>
          </>
        ) : (
          <>
            <Text style={styles.subtitle}>Set a new password</Text>

            <TextInput
              style={styles.input}
              placeholder="Verification code"
              placeholderTextColor="#89a7b6"
              value={code}
              onChangeText={setCode}
            />

            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                placeholder="New password (min 8)"
                placeholderTextColor="#89a7b6"
                secureTextEntry={!show1}
                value={pass}
                onChangeText={setPass}
              />
              <Pressable style={styles.eye} onPress={() => setShow1((v) => !v)}>
                <Icon name={show1 ? "visibility" : "visibility-off"} size={22} color="#9bb7c6" />
              </Pressable>
            </View>

            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, { paddingRight: 44 }]}
                placeholder="Confirm password"
                placeholderTextColor="#89a7b6"
                secureTextEntry={!show2}
                value={pass2}
                onChangeText={setPass2}
              />
              <Pressable style={styles.eye} onPress={() => setShow2((v) => !v)}>
                <Icon name={show2 ? "visibility" : "visibility-off"} size={22} color="#9bb7c6" />
              </Pressable>
            </View>

            <Text style={[styles.helper, { marginTop: 8 }]}>
              {pass.length > 0 && !passOK
                ? "Use at least 8 characters."
                : pass2.length > 0 && !same
                ? "Passwords do not match."
                : " "}
            </Text>

            <Pressable
              onPress={changePassword}
              disabled={!(passOK && same && codeOK) || loading}
              style={({ pressed }) => [
                styles.primaryBtn,
                (pressed || loading) && styles.primaryBtnPressed,
                (!(passOK && same && codeOK) || loading) && styles.btnDisabled,
              ]}
            >
              <Text style={styles.primaryBtnText}>
                {loading ? "Updating..." : "Change password"}
              </Text>
            </Pressable>

            <Link href="/(auth)/login" asChild> 
              <TouchableOpacity style={{ marginTop: 14 }}>
                <Text style={styles.linkText}>Back to login</Text>
              </TouchableOpacity>
            </Link>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  form: { width: "100%", maxWidth: 420, alignItems: "center" },
  subtitle: { color: palette.text, fontSize: 18, fontWeight: "700", marginBottom: 6 },
  helper: { color: palette.muted, textAlign: "center", marginBottom: 12 },

  input: {
    width: "100%",
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    marginTop: 12,
  },
  inputWrap: { width: "100%", position: "relative", marginTop: 12 },
  eye: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    width: 32,
  },

  primaryBtn: {
    marginTop: 16,
    width: "100%",
    height: 50,
    borderRadius: 16,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: palette.accent,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  btnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  linkText: { color: palette.muted, fontWeight: "600", textAlign: "center" },
});
