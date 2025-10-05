// app/main/profile.tsx
import { AuthContext } from "@/contexts/Auth_contexts";
import { fetchMyProfile } from "@/utils/profiles";
import { supabase } from "@/utils/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router"; // ⬅️ añadido useFocusEffect
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"; // ⬅️ añadido useCallback
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuroraBackground, Logo, palette } from "../../components/Brand";

export default function Profile() {
  const [hidden, setHidden] = useState(false);
  const { user, logout, isLoading } = useContext(AuthContext);

  // ======= Username for header =======
  const [headerUsername, setHeaderUsername] = useState<string>("User");

  // ======= Admin role flag =======
  const [isAdmin, setIsAdmin] = useState(false);

  // ======= Real balance =======
  const [balance, setBalance] = useState<number>(0);

  // ======= Deposit modal =======
  const [showDeposit, setShowDeposit] = useState(false);
  const [depositAmount, setDepositAmount] = useState<string>("");

  // ---- Carga de perfil extraída a función y reutilizada ----
  const reloadProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const p = await fetchMyProfile(user.id);

      const fromProfiles = p?.username?.trim();
      const fromMeta =
        (user.user_metadata as any)?.username?.trim() ||
        (user.user_metadata as any)?.full_name?.trim() ||
        (user.user_metadata as any)?.name?.trim();
      const fromEmail = user.email ? user.email.split("@")[0] : "";

      const finalName =
        (fromProfiles && fromProfiles.length > 0 && fromProfiles) ||
        (fromMeta && fromMeta.length > 0 && fromMeta) ||
        (fromEmail && fromEmail.length > 0 && fromEmail) ||
        "User";

      setHeaderUsername(finalName);
      setIsAdmin(String((p as any)?.role || "") === "ADMIN");
      setBalance(Number((p as any)?.balance ?? 0));
    } catch {
      const fallback = user?.email ? user.email.split("@")[0] : "User";
      setHeaderUsername(fallback);
    }
  }, [user?.id]);

  // Carga inicial
  useEffect(() => {
    reloadProfile();
  }, [reloadProfile]);

  // Recarga cuando la pantalla gana foco (al volver desde Home, etc.)
  useFocusEffect(
    useCallback(() => {
      reloadProfile();
      return () => {};
    }, [reloadProfile])
  );

  // Realtime: actualiza balance (y rol/username si cambian) al instante
  useEffect(() => {
    if (!user?.id) return;
    const ch = supabase
      .channel(`profile-balance:${user.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          const nb = (payload.new as any)?.balance;
          if (nb !== undefined && nb !== null) setBalance(Number(nb));
          const nrole = (payload.new as any)?.role;
          if (nrole !== undefined && nrole !== null) setIsAdmin(String(nrole) === "ADMIN");
          const nun = (payload.new as any)?.username;
          if (nun) setHeaderUsername(nun);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user?.id]);

  // Formateo COP
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
    await logout();
    router.replace("/(auth)/login");
  };

  const openDeposit = () => { setDepositAmount(""); setShowDeposit(true); };

  const confirmDeposit = async () => {
    const raw = depositAmount.replace(/[^\d.,]/g, "").replace(",", ".");
    const amount = Number(raw);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Invalid amount", "Enter a positive number.");
      return;
    }
    try {
      const { data, error } = await supabase.rpc("top_up_balance", { p_amount: amount });
      if (error) throw error;
      setBalance(Number(data ?? 0));    // feedback inmediato
      setShowDeposit(false);
      setHidden(false);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not deposit");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AuroraBackground />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Logo />
            <Text style={styles.username}>{headerUsername}</Text>
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
              <PrimaryChip icon="add" label="Deposit" onPress={openDeposit} />
              <PrimaryChip icon="south" label="Withdraw" onPress={() => { /* TODO */ }} />
            </View>
          </View>

          {/* Quick links */}
          <Text style={styles.sectionTitle}>Your account</Text>
          <View style={styles.grid}>
            <Tile icon="person" label="Personal info" onPress={() => router.push("/profile/Private_Information")} />
            <Tile icon="security" label="Security" onPress={() => router.push("/(auth)/Cambiar_contra")} />
            <Tile icon="notifications" label="Notifications" onPress={() => {}} />
            <Tile icon="support-agent" label="Support" onPress={() => {}} />
          </View>

          {/* Admin tools (only for ADMIN) */}
          {isAdmin && (
            <>
              <Text style={styles.sectionTitle}>Admin</Text>
              <View style={styles.grid}>
                <Tile icon="playlist-add" label="Create bet" onPress={() => router.push("/admin/create_bet")} />
                <Tile icon="list" label="Manage bets" onPress={() => router.push("/admin/bets")} />
              </View>
            </>
          )}

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

        {/* Deposit modal */}
        <Modal visible={showDeposit} transparent animationType="fade" onRequestClose={() => setShowDeposit(false)}>
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Deposit funds</Text>
              <Text style={styles.modalHint}>Amount (COP)</Text>
              <TextInput
                value={depositAmount}
                onChangeText={setDepositAmount}
                inputMode="decimal"
                keyboardType="numeric"
                placeholder="50.000"
                placeholderTextColor={palette.muted}
                style={styles.modalInput}
              />
              <View style={{ height: 8 }} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => setShowDeposit(false)} style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.9 }, { flex: 1 }]}>
                  <MaterialIcons name="close" size={18} color={palette.muted} />
                  <Text style={styles.ghostBtnText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmDeposit} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, { flex: 1 }]}>
                  <MaterialIcons name="check-circle" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
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

  /* Modal */
  modalWrap: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 16, padding: 16,
  },
  modalTitle: { color: palette.text, fontWeight: "900", fontSize: 16, marginBottom: 8 },
  modalHint: { color: palette.muted, marginBottom: 6 },
  modalInput: {
    backgroundColor: "#0e1b26",
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    color: palette.text,
  },

  /* Shared buttons used in modal too */
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: palette.accent, paddingVertical: 12, borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  ghostBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 10, borderRadius: 12,
  },
  ghostBtnText: { color: palette.muted, fontWeight: "800" },
});
