import { AuthProvider } from "@/contexts/Auth_contexts";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="main" />
        </Stack>
    </AuthProvider>
  )
}
