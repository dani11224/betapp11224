// app/main/_layout.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { palette } from "../../components/Brand";
import { useAuth } from "../../contexts/Auth_contexts";

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
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="sports-soccer" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="chat" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-bets"
        options={{
          href: null,          // 👈 la oculta del tab bar
          headerShown: false,
        }}
      />
            <Tabs.Screen
        name="manage-bets"
        options={{
          href: null,          // 👈 la oculta del tab bar
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="receipt-long" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <MaterialIcons name="person" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
