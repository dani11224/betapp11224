// app/profile/camera2.tsx
import { AuroraBackground, palette } from "@/components/Brand";
import Camera from "@/components/Camera";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CameraScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AuroraBackground />
        <Camera
          onSelect={(uri) => {
            const encoded = encodeURIComponent(uri);
            // volvemos a /profile/edit pasando la foto
            router.replace(`/profile/edit?avatarUri=${encoded}`);
          }}
          onCancel={() => router.back()}
          enableGallery
          enableCapture
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, backgroundColor: palette.bg },
});
