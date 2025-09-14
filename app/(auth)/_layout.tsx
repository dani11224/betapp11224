import { Stack, Redirect } from "expo-router";
import { useAuth } from "../../contexts/Auth_contexts";

export default function LayoutAuth() {
  const { session, isLoading } = useAuth();
  if (!isLoading && session) return <Redirect href="/main/homeScreen" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="Cambiar_contra" />
    </Stack>
  );
}
