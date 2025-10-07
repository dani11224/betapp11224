// app/main/my-bets.tsx
import { supabase } from "@/utils/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuroraBackground, palette } from "../../components/Brand";
import LoadingOverlay from "../../components/LoadingOverlay";

/* ========= Helpers ========= */
const first = <T,>(x: T | T[] | null | undefined): T | null =>
  Array.isArray(x) ? (x[0] ?? null) : (x ?? null);

/* ========= Tipos ========= */
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

type FavoriteRow = { created_at: string; bet: Bet | null };
type FavoriteRowDB = { created_at: string; bet: Bet | Bet[] | null };

type WagerRow = {
  id: string;
  created_at: string;
  stake: number;
  odds: number | null;
  potential_payout: number | null;
  option: { id: string; label: string; odds: number } | null;
  bet: { id: string; title: string; image_url: string | null; status: Bet["status"] } | null;
};
type WagerRowDB = {
  id: string;
  created_at: string;
  stake: number;
  odds: number | null;
  potential_payout: number | null;
  option: { id: string; label: string; odds: number } | { id: string; label: string; odds: number }[] | null;
  bet: { id: string; title: string; image_url: string | null; status: Bet["status"] } | { id: string; title: string; image_url: string | null; status: Bet["status"] }[] | null;
};

export default function MyBetsScreen() {
  const router = useRouter();

  const [screenLoading, setScreenLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [favorites, setFavorites] = useState<FavoriteRow[]>([]);
  const [wagers, setWagers] = useState<WagerRow[]>([]);

  const load = useCallback(async () => {
    try {
      if (!refreshing) setScreenLoading(true);

        const favQ = supabase
        .from("bet_favorites")
        .select(`
            created_at,
            bet:bets!bet_favorites_bet_id_fkey(
            id,title,description,image_url,base_cost,stake_min,stake_max,status,opens_at,closes_at,
            bet_options:bet_options!bet_options_bet_id_fkey(id,label,odds)
            )
        `)
        .order("created_at", { ascending: false });


      const wagQ = supabase
        .from("wagers")
        .select(`
          id, created_at,
          stake:stake_amount,
          odds:odds_at_bet,
          potential_payout,
          option:bet_options!wagers_option_id_fkey(id,label,odds),
          bet:bets!wagers_bet_id_fkey(id,title,image_url,status)
        `)
        .order("created_at", { ascending: false });

      const [{ data: favData, error: favErr }, { data: wagData, error: wagErr }] =
        await Promise.all([favQ, wagQ]);

      if (favErr) throw favErr;
      if (wagErr) throw wagErr;

      // 🔧 Normalizamos: objeto o array → objeto
      const favNorm: FavoriteRow[] = ((favData ?? []) as FavoriteRowDB[]).map(r => ({
        created_at: r.created_at,
        bet: first(r.bet),
      }));

      const wagNorm: WagerRow[] = ((wagData ?? []) as WagerRowDB[]).map(w => ({
        id: w.id,
        created_at: w.created_at,
        stake: w.stake,
        odds: w.odds,
        potential_payout: w.potential_payout,
        option: first(w.option),
        bet: first(w.bet),
      }));

      setFavorites(favNorm);
      setWagers(wagNorm);
    } catch (e: any) {
      Alert.alert("My Bets", e?.message ?? "Could not load your bets.");
    } finally {
      setScreenLoading(false);
    }
  }, [refreshing]);

  useEffect(() => {
    load();
  }, [load]);

  const formatCOP = (n: number) => {
    try {
      return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
    } catch {
      return `$ ${Math.round(n).toLocaleString("es-CO")}`;
    }
  };

  const totalStaked = useMemo(
    () => wagers.reduce((acc, w) => acc + (w.stake ?? 0), 0),
    [wagers]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AuroraBackground />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={palette.text} />
          </Pressable>
          <Text style={styles.headerTitle}>My Bets</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try { await load(); } finally { setRefreshing(false); }
              }}
              tintColor={palette.accent}
              progressBackgroundColor={palette.inputBg}
              colors={[palette.accent]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Total staked</Text>
              <Text style={styles.summaryValue}>{formatCOP(totalStaked)}</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.summaryLabel}>Bets count</Text>
              <Text style={styles.summaryValue}>{wagers.length}</Text>
            </View>
          </View>

          {/* Favorites */}
          <Text style={styles.sectionTitle}>Favorites</Text>
          {favorites.length === 0 ? (
            <View style={[styles.card, { alignItems: "center" }]}>
              <Text style={{ color: palette.muted }}>No favorites yet.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {favorites.map((row, idx) => {
                const bet = row.bet;
                if (!bet) return null;
                return (
                  <View key={`${bet.id}-${idx}`} style={styles.favCard}>
                    {bet.image_url ? (
                      <Image source={{ uri: bet.image_url }} style={styles.favImg} />
                    ) : (
                      <View style={[styles.favImg, styles.imgPlaceholder]} />
                    )}
                    <View style={{ paddingHorizontal: 10, paddingVertical: 8 }}>
                      <Text style={styles.favTitle} numberOfLines={1}>{bet.title}</Text>
                      <Text style={styles.favMeta} numberOfLines={1}>
                        {bet.status === "OPEN" ? "Open" : bet.status}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* My wagers */}
          <Text style={[styles.sectionTitle, { marginTop: 18 }]}>My wagers</Text>
          {wagers.length === 0 ? (
            <View style={[styles.card, { alignItems: "center" }]}>
              <Text style={{ color: palette.muted }}>You haven't placed any bets.</Text>
            </View>
          ) : (
            wagers.map((w) => {
              const bet = w.bet;
              const opt = w.option;
              const odds = typeof w.odds === "number" ? w.odds : (opt?.odds ?? 1);
              const payout = (w.potential_payout ?? ((w.stake ?? 0) * (odds ?? 1)));

              return (
                <View key={w.id} style={[styles.card, { marginBottom: 12 }]}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    {bet?.image_url ? (
                      <Image source={{ uri: bet.image_url }} style={styles.betImg} />
                    ) : (
                      <View style={[styles.betImg, styles.imgPlaceholder]} />
                    )}

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <Text style={styles.matchTeams} numberOfLines={1}>{bet?.title ?? "—"}</Text>
                        <View style={[styles.statusChip, bet?.status === "OPEN" ? styles.statusOpen : styles.statusOther]}>
                          <Text style={styles.statusText}>{bet?.status ?? "—"}</Text>
                        </View>
                      </View>

                      <Text style={styles.matchMeta} numberOfLines={1}>
                        Selection: <Text style={{ color: "#fff" }}>{opt?.label ?? "—"}</Text> @ {odds?.toFixed(2)}
                      </Text>

                      <View style={{ height: 6 }} />
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <View style={styles.kv}>
                          <Text style={styles.kLabel}>Stake</Text>
                          <Text style={styles.kValue}>{formatCOP(w.stake ?? 0)}</Text>
                        </View>
                        <View style={styles.kv}>
                          <Text style={styles.kLabel}>Potential</Text>
                          <Text style={styles.kValue}>{formatCOP(payout)}</Text>
                        </View>
                        <View style={styles.kv}>
                          <Text style={styles.kLabel}>Date</Text>
                          <Text style={styles.kValueSm}>{new Date(w.created_at).toLocaleDateString()}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>

      <LoadingOverlay visible={screenLoading} message="Loading your bets..." lockUntil="cycle" />
    </SafeAreaView>
  );
}

/* ========= Estilos ========= */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, paddingBottom: 32 },

  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: palette.inputBg, borderWidth: 1, borderColor: palette.border,
  },
  headerTitle: { flex: 1, textAlign: "center", color: palette.text, fontSize: 18, fontWeight: "800" },

  summary: { flexDirection: "row", gap: 10, marginBottom: 12 },
  summaryBox: {
    flex: 1,
    backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 14, padding: 12,
  },
  summaryLabel: { color: palette.muted, fontWeight: "600" },
  summaryValue: { color: "#fff", fontWeight: "900", marginTop: 6, fontSize: 16 },

  sectionTitle: { color: palette.text, fontSize: 16, fontWeight: "800", marginTop: 10, marginBottom: 10 },

  card: {
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 12,
  },
  betImg: { width: 86, height: 86, borderRadius: 12, backgroundColor: "#0f2a3c" },

  imgPlaceholder: { backgroundColor: "#0f2a3c", borderWidth: 1, borderColor: "#18445c" },

  favCard: {
    width: 180,
    backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 16, overflow: "hidden",
  },
  favImg: { width: 180, height: 96, backgroundColor: "#0f2a3c" },
  favTitle: { color: "#fff", fontWeight: "800" },
  favMeta: { color: palette.muted, marginTop: 2 },

  matchTeams: { color: palette.text, fontWeight: "800" },
  matchMeta: { color: palette.muted, marginTop: 2 },

  kv: { backgroundColor: "#0f2a3c", borderColor: "#18445c", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  kLabel: { color: "#9bb7c6", fontWeight: "700", fontSize: 12 },
  kValue: { color: "#fff", fontWeight: "900", marginTop: 2 },
  kValueSm: { color: "#fff", fontWeight: "800", marginTop: 2, fontSize: 12 },

  statusChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  statusOpen: { backgroundColor: "#103246", borderColor: "#18445c" },
  statusOther: { backgroundColor: "#221f2f", borderColor: "#3d3652" },
  statusText: { color: "#fff", fontWeight: "800", fontSize: 11 },
});
