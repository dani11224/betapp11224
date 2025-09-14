import { Tabs, Redirect } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../../contexts/Auth_contexts";
import { palette } from "../../components/Brand";

export default function MainLayout() {
  const { session, isLoading } = useAuth();
  if (!isLoading && !session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: { backgroundColor: palette.bg, borderTopColor: "#0f2a3c", height: 58 },
        tabBarLabelStyle: { fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="homeScreen"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <MaterialIcons name="sports-soccer" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="transactions"
        options={{ title: "Transactions", tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt-long" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
