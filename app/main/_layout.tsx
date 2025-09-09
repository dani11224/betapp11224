import { MaterialIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "../../components/Brand";

export default function MainLayout() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: palette.bg }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: palette.accent,
          tabBarInactiveTintColor: palette.muted,
          tabBarStyle: {
            backgroundColor: palette.bg,
            borderTopColor: "#0f2a3c",
            height: 58,
          },
          tabBarLabelStyle: { fontWeight: "600" },
        }}
      >
        {/* Home */}
        <Tabs.Screen
          name="homeScreen"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="sports-soccer" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            title: "Transactions",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="receipt-long" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}