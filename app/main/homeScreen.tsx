// app/main/home.tsx (o el nombre de tu Home actual)
import { supabase } from "@/utils/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuroraBackground, Logo, palette } from "../../components/Brand";

type BetOption = { id: string; label: string; odds: number };
type Bet = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  base_cost: number;
  stake_min: number | null;
  stake_max: number | null;
  status: "OPEN" | "CLOSED" | "SETTLED" | "CANCELLED";
  opens_at: string | null;
  closes_at: string | null;
  bet_options: BetOption[];
};

export default function HomeScreen() {
  // ======= Data =======
  const [bets, setBets] = useState<Bet[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ======= Place bet modal =======
  const [showModal, setShowModal] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<BetOption | null>(null);
  const [stake, setStake] = useState<string>("");

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("bets")
      .select(`
        id,title,description,image_url,base_cost,stake_min,stake_max,status,opens_at,closes_at,
        bet_options:bet_options!bet_options_bet_id_fkey(id,label,odds)
      `)
      .eq("status", "OPEN")
      .order("created_at", { ascending: false });
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    setBets((data ?? []) as Bet[]);
  }, []);

  useEffect(() => { load(); }, [load]);

  const formatCOP = (n: number) => {
    try {
      return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
    } catch {
      return `$ ${Math.round(n).toLocaleString("es-CO")}`;
    }
  };

  const openPlaceModal = (bet: Bet, opt: BetOption) => {
    setSelectedBet(bet);
    setSelectedOpt(opt);
    setStake("");
    setShowModal(true);
  };

  const confirmPlace = async () => {
    if (!selectedBet || !selectedOpt) return;
    const raw = stake.replace(/[^\d.,]/g, "").replace(",", ".");
    const amt = Number(raw);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid amount", "Enter a positive number.");
      return;
    }

    // (client-side) rango informativo; el servidor vuelve y valida con RLS+RPC
    const min = Number(selectedBet.stake_min ?? 0);
    const max = selectedBet.stake_max == null ? null : Number(selectedBet.stake_max);
    if (amt < min) {
      Alert.alert("Stake too low", `Minimum is ${formatCOP(min)}.`);
      return;
    }
    if (max != null && amt > max) {
      Alert.alert("Stake too high", `Maximum is ${formatCOP(max)}.`);
      return;
    }

    try {
      const { error } = await supabase.rpc("place_wager", {
        p_bet_id: selectedBet.id,
        p_option_id: selectedOpt.id,
        p_stake: amt,
      });
      if (error) throw error;
      setShowModal(false);
      Alert.alert("Placed!", `You placed ${formatCOP(amt)} at ${selectedOpt.odds.toFixed(2)}.`);
      // Si quieres, aquí puedes refresh transacciones o mostrar slip
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not place bet");
    }
  };

  const todayCount = useMemo(() => bets.length, [bets]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AuroraBackground />

        <ScrollView
          style={{ flex: 1, backgroundColor: palette.bg }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => {
              setRefreshing(true);
              try { await load(); } finally { setRefreshing(false); }
            }} />
          }
        >
          {/* Hero con logo */}
          <View style={styles.hero}>
            <Logo />
            <Text style={styles.subtitle}>Welcome back</Text>
            <Text style={styles.helper}>
              {todayCount > 0
                ? `There ${todayCount === 1 ? "is" : "are"} ${todayCount} open ${todayCount === 1 ? "market" : "markets"} today.`
                : "No open markets right now. Check back later."}
            </Text>
          </View>

          {/* Acciones rápidas */}
          <View style={styles.quickRow}>
            <QuickAction icon="live-tv" label="Live" onPress={() => {}} />
            <QuickAction icon="bolt" label="Boosts" onPress={() => {}} />
            <QuickAction icon="receipt-long" label="My Bets" onPress={() => {}} />
            <QuickAction icon="search" label="Explore" onPress={() => {}} />
          </View>

          {/* Open bets (reemplaza Today's Highlights) */}
          <Text style={styles.sectionTitle}>Open bets</Text>

          {bets.length === 0 && (
            <View style={[styles.card, { alignItems: "center" }]}>
              <Text style={{ color: palette.muted }}>No open bets available.</Text>
            </View>
          )}

          {bets.map((bet) => (
            <View key={bet.id} style={[styles.card, { marginBottom: 12 }]}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                {/* Imagen (si existe) */}
                {bet.image_url ? (
                  <Image source={{ uri: bet.image_url }} style={styles.betImg} />
                ) : (
                  <View style={[styles.betImg, { backgroundColor: "#0f2a3c", borderWidth: 1, borderColor: "#18445c" }]} />
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.matchTeams}>{bet.title}</Text>
                  {bet.description ? (
                    <Text style={styles.matchMeta} numberOfLines={2}>{bet.description}</Text>
                  ) : null}
                  <View style={{ height: 6 }} />
                  {/* Odds */}
                  <View style={styles.oddsRow}>
                    {bet.bet_options?.map((o) => (
                      <OddChip key={o.id} label={o.label} value={o.odds} onPress={() => openPlaceModal(bet, o)} />
                    ))}
                  </View>
                  {/* Min/Max stake info */}
                  <Text style={[styles.matchMeta, { marginTop: 6 }]}>
                    Min {formatCOP(Number(bet.stake_min ?? 0))}
                    {bet.stake_max != null ? ` · Max ${formatCOP(Number(bet.stake_max))}` : ""}
                  </Text>
                </View>
              </View>
            </View>
          ))}

          {/* Banner / promo (lo mantengo) */}
          <View style={styles.promo}>
            <View style={styles.promoLeft}>
              <Text style={styles.promoTitle}>Bet Boost</Text>
              <Text style={styles.promoText}>+15% on 3+ selections. Limited time.</Text>
              <Pressable style={[styles.chip, { marginTop: 10 }]}>
                <MaterialIcons name="bolt" size={16} color="#fff" />
                <Text style={styles.chipText}>Activate</Text>
              </Pressable>
            </View>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1543322748-33df6d3db806?q=80&w=800&auto=format&fit=crop",
              }}
              style={styles.promoImg}
            />
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>

        {/* Modal Place Bet */}
        <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Place bet</Text>
              <Text style={styles.modalHint}>
                {selectedBet?.title} · {selectedOpt?.label} @ {selectedOpt?.odds.toFixed(2)}
              </Text>
              {selectedBet && (
                <Text style={[styles.modalHint, { marginTop: 2 }]}>
                  Min {formatCOP(Number(selectedBet.stake_min ?? 0))}
                  {selectedBet.stake_max != null ? ` · Max ${formatCOP(Number(selectedBet.stake_max))}` : ""}
                </Text>
              )}

              <Text style={[styles.modalHint, { marginTop: 10 }]}>Stake (COP)</Text>
              <TextInput
                value={stake}
                onChangeText={setStake}
                inputMode="decimal"
                keyboardType="numeric"
                placeholder="50.000"
                placeholderTextColor={palette.muted}
                style={styles.modalInput}
              />

              <View style={{ height: 8 }} />
              <View style={{ flexDirection: "row", gap: 10 }}>
                <Pressable onPress={() => setShowModal(false)} style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.9 }, { flex: 1 }]}>
                  <MaterialIcons name="close" size={18} color={palette.muted} />
                  <Text style={styles.ghostBtnText}>Cancel</Text>
                </Pressable>
                <Pressable onPress={confirmPlace} style={({ pressed }) => [styles.primaryBtn, pressed && { opacity: 0.9 }, { flex: 1 }]}>
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

/* --- Componentes UI internos --- */
function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.qa, pressed && { opacity: 0.9 }]} onPress={onPress}>
      <MaterialIcons name={icon} size={22} color={palette.text} />
      <Text style={styles.qaLabel}>{label}</Text>
    </Pressable>
  );
}

function OddChip({ label, value, onPress }: { label: string; value: number; onPress: () => void }) {
  return (
    <Pressable style={styles.oddChip} onPress={onPress}>
      <Text style={styles.oddLabel}>{label}</Text>
      <Text style={styles.oddValue}>{value.toFixed(2)}</Text>
    </Pressable>
  );
}

/* --- Estilos --- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, paddingBottom: 32 },

  /* Hero */
  hero: { alignItems: "center", marginBottom: 6 },
  subtitle: { color: palette.text, fontSize: 18, fontWeight: "700", marginTop: 4 },
  helper: { color: palette.muted, textAlign: "center", marginTop: 6 },

  /* Acciones rápidas */
  quickRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 6,
  },
  qa: {
    flex: 1,
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  qaLabel: { color: palette.text, fontWeight: "700", marginTop: 6 },

  /* Secciones */
  sectionTitle: { color: palette.text, fontSize: 16, fontWeight: "700", marginTop: 18, marginBottom: 10 },

  /* Card de apuesta */
  card: {
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 12,
  },
  betImg: { width: 86, height: 86, borderRadius: 12, backgroundColor: "#0f2a3c" },

  matchTeams: { color: palette.text, fontWeight: "700" },
  matchMeta: { color: palette.muted, marginTop: 2 },
  oddsRow: { flexDirection: "row", gap: 8 },

  oddChip: {
    backgroundColor: "#112e41",
    borderWidth: 1,
    borderColor: "#18445c",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    minWidth: 58,
  },
  oddLabel: { color: "#9bb7c6", fontWeight: "700", fontSize: 12 },
  oddValue: { color: "#fff", fontWeight: "700", marginTop: 2 },

  /* Promo */
  promo: {
    marginTop: 18,
    flexDirection: "row",
    gap: 12,
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 12,
    alignItems: "center",
  },
  promoLeft: { flex: 1 },
  promoTitle: { color: palette.text, fontWeight: "800", fontSize: 16 },
  promoText: { color: palette.muted, marginTop: 4 },
  promoImg: { width: 84, height: 84, borderRadius: 12, backgroundColor: "#0f2a3c" },

  /* Buttons compartidos (modal) */
  primaryBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: palette.accent, paddingVertical: 12, borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "800" },
  chip: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: palette.accent,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    alignSelf: "flex-start",
  },
  chipText: { color: "#fff", fontWeight: "800" },

  /* Modal */
  modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 20 },
  modalCard: {
    width: "100%", backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 16, padding: 16,
  },
  modalTitle: { color: palette.text, fontWeight: "900", fontSize: 16, marginBottom: 6 },
  modalHint: { color: palette.muted },
  modalInput: {
    marginTop: 6,
    backgroundColor: "#0e1b26",
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
    color: palette.text,
  },

    ghostBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ghostBtnText: { color: palette.muted, fontWeight: "800" },
});
