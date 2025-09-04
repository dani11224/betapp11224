import React, { useEffect, useRef, useState } from "react";
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
import Icon from "react-native-vector-icons/MaterialIcons";

export default function Page() {
  return (
    <View style={styles.container}>
      {/* Fondo bonito y animado */}
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

        <TouchableOpacity style={styles.linkRight}>
          <Text style={styles.linkText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Pressable style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}>
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

/* ---------- Fondo “Aurora” animado ---------- */
const AuroraBackground = () => {
  const p1 = useRef(new Animated.Value(0)).current;
  const p2 = useRef(new Animated.Value(0)).current;
  const p3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = (val: Animated.Value, to: number, dur: number, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(val, { toValue: to, duration: dur, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: -to, duration: dur, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();

    loop(p1, 14, 9000);
    loop(p2, 18, 11000, 800);
    loop(p3, 12, 10000, 400);
  }, [p1, p2, p3]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {/* blob rojo superior (resalta el logo) */}
      <Animated.View
        style={[
          styles.blob,
          {
            backgroundColor: "rgba(255, 42, 42, 0.16)",
            width: 360,
            height: 360,
            borderRadius: 180,
            top: 90,
            alignSelf: "center",
            transform: [{ translateX: p1 }, { translateY: Animated.multiply(p1, 0.3) }],
            shadowColor: "#ff2a2a",
          },
        ]}
      />
      {/* blob azul oscuro izquierda */}
      <Animated.View
        style={[
          styles.blob,
          {
            backgroundColor: "rgba(33, 150, 243, 0.10)",
            width: 420,
            height: 420,
            borderRadius: 210,
            left: -140,
            top: 340,
            transform: [{ translateX: p2 }, { translateY: Animated.multiply(p2, -0.4) }],
            shadowColor: "#2196f3",
          },
        ]}
      />
      {/* blob verde tenue derecha (equilibra con el botón Google) */}
      <Animated.View
        style={[
          styles.blob,
          {
            backgroundColor: "rgba(76, 175, 80, 0.10)",
            width: 360,
            height: 360,
            borderRadius: 180,
            right: -120,
            bottom: 120,
            transform: [{ translateX: p3 }, { translateY: Animated.multiply(p3, 0.5) }],
            shadowColor: "#4caf50",
          },
        ]}
      />
      {/* viñeta sutil para foco central */}
      <View style={styles.vignette} />
    </View>
  );
};

/* ---------- Logo con pulso + spotlight extra ---------- */
const Logo = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim1 = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    const anim2 = Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(ring, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    anim1.start(); anim2.start();
    return () => { anim1.stop(); anim2.stop(); };
  }, [pulse, ring]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  const ringScale = ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.25] });
  const ringOpacity = ring.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.02] });

  return (
    <View style={styles.logoWrap}>
      <Animated.View style={[styles.logoRing, { transform: [{ scale: ringScale }], opacity: ringOpacity }]} />
      <Animated.View style={[styles.pulse, { transform: [{ scale }], opacity }]} />
      <View style={styles.logoCircle}>
        <Icon name="sports-soccer" size={44} color="#ff2a2a" />
      </View>
      <Text style={styles.brand}>BetApp</Text>
    </View>
  );
};

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
    backgroundColor: "#071a2c",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  /* ------ Aurora blobs + viñeta ------ */
  blob: {
    position: "absolute",
    shadowOpacity: 0.7,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    // oscurece bordes para foco central
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 80,
  },

  /* ------ Logo ------ */
  logoWrap: { alignItems: "center", marginBottom: 18 },
  logoRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: "rgba(255,42,42,0.25)",
    backgroundColor: "rgba(255,42,42,0.06)",
  },
  pulse: {
    position: "absolute",
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,42,42,0.25)",
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0b2a3a",
    borderWidth: 2,
    borderColor: "#ff2a2a",
    shadowColor: "#ff2a2a",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  brand: {
    marginTop: 10,
    color: "#e8f2f7",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 1,
  },

  /* ------ Formulario ------ */
  form: { width: "100%", maxWidth: 420, alignItems: "center" },
  input: {
    width: "100%",
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#0e2a3b",
    borderWidth: 1,
    borderColor: "#163c52",
    color: "#eaf2f7",
    marginTop: 14,
  },
  linkRight: { alignSelf: "flex-end", marginTop: 10 },
  linkText: { color: "#9bb7c6", fontWeight: "600" },

  primaryBtn: {
    marginTop: 16,
    width: "100%",
    height: 50,
    borderRadius: 16,
    backgroundColor: "#ff2a2a",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#ff2a2a",
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  primaryBtnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  primaryBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },

  separator: { color: "#eaf2f7", marginTop: 22, marginBottom: 10 },

  /* ------ Botones sociales ------ */
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
  igFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgb(255,0,0)",
    zIndex: -1,
  },
  igText: {
    color: "rgb(255,0,0)",
    fontSize: 17,
    fontWeight: "700",
  },
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
  gmFill: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(18, 134, 5, 1)",
    zIndex: -1,
  },
  gmText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "700",
  },
});
