// components/Camera.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import {
  CameraView,
  useCameraPermissions,
  type CameraPictureOptions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { MaterialIcons } from "@expo/vector-icons";

// Si prefieres, importa tu Brand palette:
// import { palette } from "@/components/Brand";
const palette = {
  bg: "#0F1115",
  inputBg: "#171A22",
  border: "#2A2F3C",
  text: "#F4F6FB",
  muted: "#9AA3B2",
  accent: "#FF4D6D",
};

type CameraProps = {
  onSelect: (uri: string) => void; // URI seleccionada/capturada
  onCancel?: () => void;
  enableGallery?: boolean; // default true
  enableCapture?: boolean; // default true
};

export default function Camera({
  onSelect,
  onCancel,
  enableGallery = true,
  enableCapture = true,
}: CameraProps) {
  const [camPermission, requestCamPermission] = useCameraPermissions();
  const [libStatus, requestLibPermission] = ImagePicker.useMediaLibraryPermissions();

  const cameraRef = useRef<CameraView | null>(null);
  const [facing, setFacing] = useState<"front" | "back">("front");
  const [isBusy, setIsBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!camPermission?.granted) await requestCamPermission();
      if (enableGallery && !libStatus?.granted) await requestLibPermission();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickFromGallery = async () => {
    try {
      setIsBusy(true);
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1], // avatar cuadrado
        quality: 0.9,
      });
      if (!res.canceled && res.assets?.length) {
        setPreview(res.assets[0].uri);
      }
    } finally {
      setIsBusy(false);
    }
  };

  const capture = async () => {
    if (!cameraRef.current) return;
    try {
      setIsBusy(true);
      const options: CameraPictureOptions = { quality: 0.9, skipProcessing: true };
      const photo = await cameraRef.current.takePictureAsync(options);
      if (photo?.uri) setPreview(photo.uri);
    } finally {
      setIsBusy(false);
    }
  };

  const usePhoto = () => {
    if (preview) onSelect(preview);
  };

  const resetPreview = () => setPreview(null);

  if (!camPermission) {
    return (
      <Centered>
        <ActivityIndicator color={palette.text} />
        <Text style={styles.muted}>Checking permissions…</Text>
      </Centered>
    );
  }

  if (!camPermission.granted) {
    return (
      <Centered>
        <Text style={styles.title}>Camera access</Text>
        <Text style={styles.muted}>We need camera permission to take a profile photo.</Text>
        <Primary onPress={requestCamPermission} label="Grant camera permission" />
        {onCancel && <Ghost onPress={onCancel} label="Cancel" />}
      </Centered>
    );
  }

  // Preview
  if (preview) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.previewWrap}>
          <Image source={{ uri: preview }} style={styles.preview} />
        </View>
        <View style={styles.controlsRow}>
          <Ghost icon="close" label="Retake" onPress={resetPreview} />
          <Primary icon="check" label="Use photo" onPress={usePhoto} />
        </View>
      </View>
    );
  }

  // Camera
  return (
    <View style={styles.wrapper}>
      {/* “cositos” */}
      <View pointerEvents="none" style={styles.bubbleOne} />
      <View pointerEvents="none" style={styles.bubbleTwo} />
      <View pointerEvents="none" style={styles.bubbleThree} />

      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          autofocus="on"
          ratio="16:9"
        />
      </View>

      <View style={styles.controlsRow}>
        <Ghost
          icon="flip-camera-ios"
          label={facing === "front" ? "Back camera" : "Front camera"}
          onPress={() => setFacing(facing === "front" ? "back" : "front")}
        />

        {enableCapture && (
          <Pressable
            onPress={capture}
            disabled={isBusy}
            style={({ pressed }) => [
              styles.shutter,
              pressed && { transform: [{ scale: 0.98 }] },
              isBusy && { opacity: 0.7 },
            ]}
          >
            {isBusy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <MaterialIcons name="camera" size={22} color="#fff" />
            )}
          </Pressable>
        )}

        {enableGallery && (
          <Ghost icon="photo-library" label="Gallery" onPress={pickFromGallery} />
        )}
      </View>

      {onCancel && (
        <View style={{ marginTop: 10, alignItems: "center" }}>
          <Text onPress={onCancel} style={styles.cancelText}>Cancel</Text>
        </View>
      )}
    </View>
  );
}

/* ---- helpers UI ---- */
function Centered({ children }: { children: React.ReactNode }) {
  return (
    <View style={[styles.wrapper, { justifyContent: "center", alignItems: "center" }]}>
      {children}
    </View>
  );
}

function Primary({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.95 }]}>
      {icon && <MaterialIcons name={icon} size={16} color="#fff" style={{ marginRight: 6 }} />}
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

function Ghost({
  label,
  onPress,
  icon,
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.9 }]}>
      {icon && <MaterialIcons name={icon} size={16} color={palette.text} style={{ marginRight: 6 }} />}
      <Text style={styles.ghostText}>{label}</Text>
    </Pressable>
  );
}

/* ---- styles ---- */
const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: palette.bg, padding: 16 },

  // Preview
  previewWrap: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.inputBg,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 480,
  },
  preview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  cameraWrap: {
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.inputBg,
  },
  camera: { width: "100%", height: 480 },

  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginTop: 12,
  },

  shutter: {
    width: 64,
    height: 64,
    borderRadius: 40,
    backgroundColor: palette.accent,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
  },

  primaryBtn: {
    backgroundColor: palette.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800" },

  ghostBtn: {
    backgroundColor: "#1a202c",
    borderWidth: 1,
    borderColor: palette.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  ghostText: { color: palette.text, fontWeight: "700" },

  cancelText: { color: palette.muted, fontWeight: "700" },

  // “cositos”
  bubbleOne: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: "#FF29444D",
    top: -40,
    right: -60,
    shadowColor: palette.accent,
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
    bottom: 140,
    left: -40,
    shadowColor: "#FF91A8",
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
    bottom: 230,
    right: 24,
    shadowColor: "#FF91A8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },

  title: { color: palette.text, fontWeight: "800", fontSize: 18, marginBottom: 8 },
  muted: { color: palette.muted, marginTop: 6 },
});
