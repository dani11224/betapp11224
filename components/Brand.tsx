// components/Brand.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

export const palette = {
  bg: "#071a2c",
  accent: "#ff2a2a",
  inputBg: "#0e2a3b",
  border: "#163c52",
  text: "#eaf2f7",
  muted: "#9bb7c6",
};

export const AuroraBackground = () => {
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
      <Animated.View
        style={[
          styles.blob,
          {
            backgroundColor: "rgba(255, 42, 42, 0.16)",
            width: 360, height: 360, borderRadius: 180, top: 90, alignSelf: "center",
            transform: [{ translateX: p1 }, { translateY: Animated.multiply(p1, 0.3) }],
            shadowColor: palette.accent,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          {
            backgroundColor: "rgba(33, 150, 243, 0.10)",
            width: 420, height: 420, borderRadius: 210, left: -140, top: 340,
            transform: [{ translateX: p2 }, { translateY: Animated.multiply(p2, -0.4) }],
            shadowColor: "#2196f3",
          },
        ]}
      />
      <Animated.View
        style={[
          styles.blob,
          {
            backgroundColor: "rgba(76, 175, 80, 0.10)",
            width: 360, height: 360, borderRadius: 180, right: -120, bottom: 120,
            transform: [{ translateX: p3 }, { translateY: Animated.multiply(p3, 0.5) }],
            shadowColor: "#4caf50",
          },
        ]}
      />
      <View style={styles.vignette} />
    </View>
  );
};

export const Logo = () => {
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
        <Icon name="sports-soccer" size={44} color={palette.accent} />
      </View>
      <Text style={styles.brand}>BetApp</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  blob: {
    position: "absolute",
    shadowOpacity: 0.7,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 80,
  },
  logoWrap: { alignItems: "center", marginBottom: 18 },
  logoRing: {
    position: "absolute",
    width: 220, height: 220, borderRadius: 110,
    borderWidth: 2, borderColor: "rgba(255,42,42,0.25)",
    backgroundColor: "rgba(255,42,42,0.06)",
  },
  pulse: { position: "absolute", width: 96, height: 96, borderRadius: 48, backgroundColor: "rgba(255,42,42,0.25)" },
  logoCircle: {
    width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center",
    backgroundColor: "#0b2a3a", borderWidth: 2, borderColor: palette.accent,
    shadowColor: palette.accent, shadowOpacity: 0.6, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 8,
  },
  brand: { marginTop: 10, color: "#e8f2f7", fontSize: 18, fontWeight: "700", letterSpacing: 1 },
});
