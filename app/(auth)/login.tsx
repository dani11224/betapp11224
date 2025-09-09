import { Link, router } from "expo-router";
import React, { useRef, useState } from "react";
import {
    Animated,
    Easing,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { AuroraBackground, Logo, palette } from "../../components/Brand";

export default function Login() {
  return (
    <View style={styles.container}>
      <AuroraBackground />
      <Logo />

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="User"
          placeholderTextColor="#89a7b6"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#89a7b6"
          secureTextEntry
        />

        {/* Links en fila y con Expo Router */}
        <View style={styles.linksRow}>
          <Link href="/(auth)/register" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Don't have an account?</Text>
            </TouchableOpacity>
          </Link>

          <Link href="/(auth)/Cambiar_contra" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Forgot Password?</Text>
            </TouchableOpacity>
          </Link>
        </View>

        <Pressable 
            onPress={() => router.replace("/main/homeScreen")}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}>
          <Text style={styles.primaryBtnText}>Login</Text>
        </Pressable>
      </View>

      <Text style={styles.separator}>Or login with</Text>
      <View style={styles.socialRow}>
        <IGButton label="Instagram" onPress={() => {}} />
        <View style={{ width: 16 }} />
        <GMButton label="Google" onPress={() => {}} />
      </View>
    </View>
  );
}

/* ---------- Botón Instagram con “relleno” animado ---------- */
const IGButton = ({ label, onPress }: { label: string; onPress?: () => void }) => {
  const [width, setWidth] = useState(0);
  const [pressed, setPressed] = useState(false);
  const fill = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    setPressed(true);
    Animated.timing(fill, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  };
  const pressOut = () => {
    Animated.timing(fill, { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(() => {
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

/* ---------- Botón Google con “relleno” animado ---------- */
const GMButton = ({ label, onPress }: { label: string; onPress?: () => void }) => {
  const [width, setWidth] = useState(0);
  const [pressed, setPressed] = useState(false);
  const fill = useRef(new Animated.Value(0)).current;

  const pressIn = () => {
    setPressed(true);
    Animated.timing(fill, { toValue: 1, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  };
  const pressOut = () => {
    Animated.timing(fill, { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: false }).start(() => {
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

  /* fila de enlaces */
  linksRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  linkText: { color: palette.muted, fontWeight: "600" },

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
  primaryBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },

  separator: { color: palette.text, marginTop: 22, marginBottom: 10 },

  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  igBtn: {
    borderWidth: 1,
    borderColor: "rgb(255,0,0)",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 28,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  igFill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "rgb(255,0,0)", zIndex: -1 },
  igText: { color: "rgb(255,0,0)", fontSize: 17, fontWeight: "700" },

  gmBtn: {
    borderWidth: 1,
    borderColor: "rgba(25, 100, 2, 1)",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 28,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  gmFill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "rgba(18, 134, 5, 1)", zIndex: -1 },
  gmText: { color: "#ffffff", fontSize: 17, fontWeight: "700" },
});
