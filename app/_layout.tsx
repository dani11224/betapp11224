import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* aquí declaras los grupos de nivel superior */}
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="main" />
    </Stack>
  );
}
