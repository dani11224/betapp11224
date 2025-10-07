import React, { useRef, useEffect, useState, memo } from "react";
import { Modal, View, StyleSheet, Platform, Text } from "react-native";
import LottieView from "lottie-react-native";
import { BlurView } from "expo-blur";
import { palette } from "./Brand";

// IMPORTANTE: si TS se queja al importar JSON, activa "resolveJsonModule": true en tsconfig
// o crea un types/json.d.ts con: declare module "*.json";
import rouletteAnim from "../assets/lottie/roulette.json"; // Para calcular la duración del ciclo automáticamente

type LockMode = "cycle" | "min" | "none";

type Props = {
  visible: boolean;
  message?: string;
  /** "cycle": espera a terminar el giro actual.
   *  "min": respeta un mínimo (minDurationMs).
   *  "none": oculta apenas visible=false. */
  lockUntil?: LockMode;
  /** Mínimo visible si lockUntil === "min" (por defecto 900ms) */
  minDurationMs?: number;
};

function LoadingOverlay({
  visible,
  message = "Loading...",
  lockUntil = "cycle",
  minDurationMs = 900,
}: Props) {
  const ref = useRef<LottieView>(null);

  // Duración exacta del ciclo (según el JSON): (op - ip) / fr
  const cycleMs = Math.max(
    400,
    Math.round(((rouletteAnim as any).op - (rouletteAnim as any).ip) / (rouletteAnim as any).fr * 1000)
  );

  const [show, setShow] = useState(false);      // controla si el Modal está montado
  const startRef = useRef<number>(0);           // cuándo se mostró
  const hideTimer = useRef<number | null>(null);

  // Limpia timers
  const clearHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  };

  useEffect(() => {
    if (visible) {
      clearHideTimer();
      setShow(true);
      startRef.current = Date.now();
      // arranca/reinicia la animación
      requestAnimationFrame(() => {
        ref.current?.reset();
        ref.current?.play();
      });
    } else {
      // Se pidió ocultar: aplicamos la estrategia de "delay"
      const elapsed = Date.now() - (startRef.current || Date.now());
      let delay = 0;

      if (lockUntil === "cycle") {
        // Espera a cerrar el ciclo actual
        const remainder = elapsed % cycleMs;
        delay = remainder === 0 ? 0 : (cycleMs - remainder);
        // Evita "cortes" si remainder es muy chico (opcional)
        if (delay < 120) delay += cycleMs;
      } else if (lockUntil === "min") {
        delay = Math.max(0, minDurationMs - elapsed);
      } else {
        delay = 0;
      }

      clearHideTimer();
      hideTimer.current = setTimeout(() => {
        setShow(false);
      }, delay);
    }

    return clearHideTimer;
  }, [visible, lockUntil, minDurationMs, cycleMs]);

  if (!show) return null;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <View style={styles.fill}>
        {/* Fondo visible, desenfocado y ligeramente oscurecido */}
        <BlurView intensity={40} tint="dark" style={styles.fill} />
        <View style={styles.veil} />

        {/* Ventana (tarjeta) centrada */}
        <View style={styles.window}>
          <LottieView
            ref={ref}
            // Puedes usar el mismo objeto importado; también funciona require("../assets/lottie/roulette.json")
            source={rouletteAnim as any}
            autoPlay={false}
            loop // dejamos loop; el "delay" decide cuándo cerrar
            style={{ width: 160, height: 160 }}
            renderMode={Platform.OS === "android" ? "HARDWARE" : "AUTOMATIC"}
          />
          <Text style={styles.msg}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  window: {
    position: "absolute",
    alignSelf: "center",
    top: "30%",
    width: 260,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  msg: {
    color: palette.text,
    fontWeight: "800",
    marginTop: 6,
  },
});

export default memo(LoadingOverlay);
