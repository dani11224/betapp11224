// app/(auth)/register.tsx
import { AuthContext } from "@/contexts/Auth_contexts";
import { Link, router } from "expo-router";
import React, { useContext, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { AuroraBackground, Logo, palette } from "../../components/Brand";

export default function Register() {
  const [agree, setAgree] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // opcional: si luego lo guardas en el perfil
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  const context = useContext(AuthContext);

  const emailOK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passLenOK = password.length >= 8;
  const same = password === confirm;
  const canSubmit = agree && name && emailOK && passLenOK && same;

  const handleRegister = async () => {
    setError(null);
    if (!canSubmit) {
      if (!name || !email || !password || !confirm) return setError("Please fill all fields");
      if (!emailOK) return setError("Invalid email");
      if (!passLenOK) return setError("Password must be at least 8 characters");
      if (!same) return setError("Passwords do not match");
      if (!agree) return setError("You must accept the Terms & Privacy");
      return;
    }

    try {
      await context.register(email, password, name); // tu AuthContext debe lanzar si falla
      router.replace("/main/homeScreen");
    } catch (e: any) {
      setError(e?.message || "Registration failed");
    }
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <Logo />

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#89a7b6"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#89a7b6"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor="#89a7b6"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8)"
          placeholderTextColor="#89a7b6"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor="#89a7b6"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        {/* Feedback */}
        {!!error && <Text style={{ color: "#c22525", marginTop: 8 }}>{error}</Text>}
        {context.isLoading && <Text style={{ color: palette.muted, marginTop: 8 }}>Loading...</Text>}

        {/* Terms */}
        <Pressable style={styles.termsRow} onPress={() => setAgree(!agree)}>
          <View style={[styles.checkbox, agree && styles.checkboxOn]} />
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms & Privacy</Text>
          </Text>
        </Pressable>

        <Pressable
          onPress={handleRegister}
          disabled={!canSubmit || context.isLoading}
          style={({ pressed }) => [
            styles.primaryBtn,
            (pressed || context.isLoading) && styles.primaryBtnPressed,
            (!canSubmit || context.isLoading) && { opacity: 0.5 },
          ]}
        >
          {context.isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryBtnText}>Create Account</Text>
          )}
        </Pressable>
      </View>

      <Text style={styles.separator}>Or sign up with</Text>
      <View style={styles.socialRow}>
        <IGButton label="Instagram" onPress={() => {}} />
        <View style={{ width: 16 }} />
        <GMButton label="Google" onPress={() => {}} />
      </View>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity style={{ marginTop: 16 }}>
          <Text style={{ color: palette.muted }}>
            Already have an account?{" "}
            <Text style={{ color: palette.text, fontWeight: "700" }}>Log in</Text>
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

/* --- Social buttons (same style as Login) --- */
const IGButton = ({ label, onPress }: { label: string; onPress?: () => void }) => {
  const [width, setWidth] = useState(0);
  const [pressed, setPressed] = useState(false);
  const fill = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    setPressed(true);
    Animated.timing(fill, { toValue: 1, duration: 350, useNativeDriver: false }).start();
  };
  const pressOut = () => {
    Animated.timing(fill, { toValue: 0, duration: 350, useNativeDriver: false }).start(() => {
      setPressed(false);
      onPress && onPress();
    });
  };

  const animatedWidth = fill.interpolate({ inputRange: [0, 1], outputRange: [0, width] });

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <View style={styles.igBtn} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.igFill, { width: animatedWidth }]} />
        <Text style={[styles.igText, pressed && { color: "#fff" }]}>{label}</Text>
      </View>
    </Pressable>
  );
};

const GMButton = ({ label, onPress }: { label: string; onPress?: () => void }) => {
  const [width, setWidth] = useState(0);
  const [pressed, setPressed] = useState(false);
  const fill = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    setPressed(true);
    Animated.timing(fill, { toValue: 1, duration: 350, useNativeDriver: false }).start();
  };
  const pressOut = () => {
    Animated.timing(fill, { toValue: 0, duration: 350, useNativeDriver: false }).start(() => {
      setPressed(false);
      onPress && onPress();
    });
  };

  const animatedWidth = fill.interpolate({ inputRange: [0, 1], outputRange: [0, width] });

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <View style={styles.gmBtn} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Animated.View style={[styles.gmFill, { width: animatedWidth }]} />
        <Text style={[styles.gmText, pressed && { color: "#fff" }]}>{label}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  form: { width: "100%", maxWidth: 420, alignItems: "center" },
  input: {
    width: "100%",
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    color: palette.text,
    marginTop: 14,
  },

  termsRow: { width: "100%", flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, marginBottom: 4 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 2, borderColor: palette.accent, backgroundColor: "transparent" },
  checkboxOn: { backgroundColor: palette.accent },
  termsText: { color: palette.muted },
  termsLink: { color: palette.text, fontWeight: "700" },

  primaryBtn: {
    marginTop: 14,
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
  primaryBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },

  separator: { color: palette.text, marginTop: 22, marginBottom: 10 },

  socialRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },

  igBtn: {
    borderWidth: 1, borderColor: "rgb(255,0,0)", borderRadius: 25,
    paddingVertical: 12, paddingHorizontal: 28, overflow: "hidden",
    position: "relative", alignItems: "center", justifyContent: "center",
  },
  igFill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "rgb(255,0,0)", zIndex: -1 },
  igText: { color: "rgb(255,0,0)", fontSize: 17, fontWeight: "700" },

  gmBtn: {
    borderWidth: 1, borderColor: "rgba(25, 100, 2, 1)", borderRadius: 25,
    paddingVertical: 12, paddingHorizontal: 28, overflow: "hidden",
    position: "relative", alignItems: "center", justifyContent: "center",
  },
  gmFill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "rgba(18, 134, 5, 1)", zIndex: -1 },
  gmText: { color: "#ffffff", fontSize: 17, fontWeight: "700" },
});
