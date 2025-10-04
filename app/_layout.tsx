import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/Auth_contexts";
import { DataProvider } from "@/contexts/data_contexts"; // 👈 importa tu DataProvider

export default function RootLayout() {
  return (
    <AuthProvider>
      <DataProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="main" />
        </Stack>
      </DataProvider>
    </AuthProvider>
  );
}
