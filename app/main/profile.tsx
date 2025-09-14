import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuroraBackground, Logo, palette } from "../../components/Brand";
import { AuthContext } from "@/contexts/Auth_contexts";

export default function Profile() {
  const [hidden, setHidden] = useState(false);
  const [balance] = useState<number>(250000); // COP

  const { user, logout, isLoading } = useContext(AuthContext);

  const formatted = useMemo(() => {
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(balance);
    } catch {
      return `$ ${balance.toLocaleString("es-CO")}`;
    }
  }, [balance]);

  const onLogout = async () => {
    await logout();                    // <-- cierra sesión real
    router.replace("/(auth)/login");   // <-- luego navega al login
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AuroraBackground />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Logo />
            <Text style={styles.username}>
              {user?.user_metadata?.full_name || user?.email || "User"}
            </Text>
            <Text style={styles.muted}>ID: {user?.id ? user.id.slice(0, 8) : "—"}</Text>
          </View>

          {/* Balance card */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.cardTitle}>Available balance</Text>
              <Pressable onPress={() => setHidden(v => !v)} hitSlop={8}>
                <MaterialIcons
                  name={hidden ? "visibility-off" : "visibility"}
                  size={20}
                  color={palette.muted}
                />
              </Pressable>
            </View>

            <Text style={styles.balanceText}>
              {hidden ? "••••••••" : formatted}
            </Text>

            <View style={styles.actionsRow}>
              <PrimaryChip icon="add" label="Deposit" onPress={() => { /* TODO */ }} />
              <PrimaryChip icon="south" label="Withdraw" onPress={() => { /* TODO */ }} />
            </View>
          </View>

          {/* Quick links */}
          <Text style={styles.sectionTitle}>Your account</Text>
          <View style={styles.grid}>
            <Tile icon="person" label="Personal info" onPress={() => {}} />
            <Tile icon="security" label="Security" onPress={() => router.push("/(auth)/Cambiar_contra")} />
            <Tile icon="notifications" label="Notifications" onPress={() => {}} />
            <Tile icon="support-agent" label="Support" onPress={() => {}} />
          </View>

          {/* Summary */}
          <Text style={styles.sectionTitle}>Summary</Text>
          <View style={styles.statsRow}>
            <Stat label="Active bets" value="3" />
            <Stat label="Settled bets" value="12" />
            <Stat label="Profit" value="+$180,000" />
          </View>

          {/* Logout */}
          <Pressable
            onPress={onLogout}
            disabled={isLoading}
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.9 }, isLoading && { opacity: 0.6 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialIcons name="logout" size={18} color="#fff" />
                <Text style={styles.logoutText}>Log out</Text>
              </>
            )}
          </Pressable>

          <View style={{ height: 28 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ----- Small UI pieces ----- */
function PrimaryChip({
  icon,
  label,
  onPress,
}: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.primaryChip, pressed && { opacity: 0.9 }]}>
      <MaterialIcons name={icon} size={16} color="#fff" />
      <Text style={styles.primaryChipText}>{label}</Text>
    </Pressable>
  );
}

function Tile({
  icon,
  label,
  onPress,
}: { icon: React.ComponentProps<typeof MaterialIcons>["name"]; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.tile, pressed && { opacity: 0.9 }]}>
      <MaterialIcons name={icon} size={22} color={palette.text} />
      <Text style={styles.tileLabel}>{label}</Text>
    </Pressable>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

/* ----- Styles ----- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, paddingBottom: 32 },

  header: { alignItems: "center", marginBottom: 6 },
  username: { color: palette.text, fontSize: 18, fontWeight: "800", marginTop: 4 },
  muted: { color: palette.muted },

  balanceCard: {
    backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 18, padding: 14, marginTop: 16,
  },
  balanceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: palette.muted, fontWeight: "700" },
  balanceText: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 6 },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: 14 },

  primaryChip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: palette.accent, paddingHorizontal: 12, paddingVertical: 10,
    borderRadius: 12,
  },
  primaryChipText: { color: "#fff", fontWeight: "800" },

  sectionTitle: {
    color: palette.text, fontSize: 16, fontWeight: "800",
    marginTop: 18, marginBottom: 10,
  },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: {
    width: "48%", backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 16, paddingVertical: 16, alignItems: "center", gap: 6,
  },
  tileLabel: { color: palette.text, fontWeight: "700" },

  statsRow: { flexDirection: "row", gap: 10 },
  stat: {
    flex: 1, backgroundColor: "#0f2a3c",
    borderWidth: 1, borderColor: "#18445c",
    borderRadius: 14, paddingVertical: 12, alignItems: "center",
  },
  statValue: { color: "#fff", fontWeight: "900" },
  statLabel: { color: "#cfe5f0", fontWeight: "700", marginTop: 2, textAlign: "center" },

  logoutBtn: {
    marginTop: 20, alignSelf: "center",
    flexDirection: "row", gap: 8,
    backgroundColor: "#c22525", paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 12,
  },
  logoutText: { color: "#fff", fontWeight: "800" },
});
