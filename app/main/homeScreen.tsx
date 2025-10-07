// app/main/home.tsx
import { supabase } from "@/utils/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import LoadingOverlay from "../../components/LoadingOverlay";

import {
  addFavorite,
  listMyFavoriteIds,
  removeFavorite,
} from "../admin/bets";

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

type CoinSide = "HEADS" | "TAILS";
const COIN_LABEL: Record<CoinSide, string> = { HEADS: "Cara", TAILS: "Sello" };

/* --- Minijuego: Coin Flip --- */
function CoinFlipGame() {
  const [choice, setChoice] = useState<CoinSide | null>(null);
  const [status, setStatus] = useState<"idle" | "flipping" | "done">("idle");
  const [outcome, setOutcome] = useState<CoinSide | null>(null);

  const lottieRef = useRef<LottieView>(null);

  const onFlip = () => {
    if (!choice || status === "flipping") return;
    setStatus("flipping");
    setOutcome(null);

    // Resultado justo 50/50
    const result: CoinSide = Math.random() < 0.5 ? "HEADS" : "TAILS";
    setOutcome(result);

    // Reproducir animación
    requestAnimationFrame(() => {
      lottieRef.current?.reset();
      lottieRef.current?.play();
    });

    // Duración estimada de la animación (ajústala si tu JSON dura distinto)
    setTimeout(() => setStatus("done"), 1800);
  };

  const onReset = () => {
    setStatus("idle");
    setOutcome(null);
  };

  const won = outcome && choice && outcome === choice;

  return (
    <View style={styles.coinCard}>
      <Text style={styles.coinTitle}>Coin Flip</Text>
      <Text style={styles.coinHint}>Pick your side and flip the coin.</Text>

      {/* Elección Cara/Sello */}
      <View style={styles.coinChoiceRow}>
        {(["HEADS", "TAILS"] as CoinSide[]).map((opt) => {
          const active = choice === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => setChoice(opt)}
              disabled={status === "flipping"}
              style={({ pressed }) => [
                styles.coinChip,
                active && styles.coinChipActive,
                pressed && { opacity: 0.9 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Choose ${COIN_LABEL[opt]}`}
            >
              <Text style={[styles.coinChipText, active && styles.coinChipTextActive]}>
                {COIN_LABEL[opt]}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Animación */}
      <View style={styles.coinAnimWrap}>
        <LottieView
          ref={lottieRef}
          source={require("../../assets/lottie/coin.json")}
          // Si prefieres remoto: source={{ uri: "https://.../coin.json" }}
          autoPlay={false}
          loop={false}
          style={{ width: 200, height: 200 }}
        />
      </View>

      {/* Botones / Resultado */}
      {status !== "done" ? (
        <Pressable
          onPress={onFlip}
          disabled={!choice || status === "flipping"}
          style={({ pressed }) => [
            styles.primaryBtn,
            pressed && { opacity: 0.9 },
            (!choice || status === "flipping") && { opacity: 0.6 },
          ]}
        >
          <MaterialIcons name="casino" size={18} color="#fff" />
          <Text style={styles.primaryBtnText}>
            {status === "flipping" ? "Flipping..." : "Flip"}
          </Text>
        </Pressable>
      ) : (
        <View style={{ gap: 10 }}>
          <Text
            style={[
              styles.resultText,
              won ? { color: "#5CFF8A" } : { color: "#FF6B6B" },
            ]}
          >
            {won ? "You won!" : "You lost."} It was {COIN_LABEL[outcome as CoinSide]}.
          </Text>
          <Pressable
            onPress={onReset}
            style={({ pressed }) => [styles.ghostBtn, pressed && { opacity: 0.9 }]}
          >
            <MaterialIcons name="refresh" size={18} color={palette.muted} />
            <Text style={styles.ghostBtnText}>Play again</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function HomeScreen() {
  // ======= Data =======
  const [bets, setBets] = useState<Bet[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // ======= Loading overlays =======
  const [screenLoading, setScreenLoading] = useState(true); // carga inicial
  const [busyAction, setBusyAction] = useState(false); // acciones (RPC) como place bet

  // ======= Favoritos (ids) =======
  const [favIds, setFavIds] = useState<Set<string>>(new Set());
  const [togglingFavs, setTogglingFavs] = useState<Set<string>>(new Set()); // evita doble tap

  // ======= Place bet modal =======
  const [showModal, setShowModal] = useState(false);
  const [selectedBet, setSelectedBet] = useState<Bet | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<BetOption | null>(null);
  const [stake, setStake] = useState<string>("");

  // ======= util =======
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      if (!refreshing) setScreenLoading(true);

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
    } finally {
      setScreenLoading(false);
    }
  }, [refreshing]);

  // Cargar apuestas
  useEffect(() => {
    load();
  }, [load]);

  // Cargar mis favoritos (ids) una vez al entrar
  useEffect(() => {
    (async () => {
      try {
        const ids = await listMyFavoriteIds();
        setFavIds(new Set(ids));
      } catch (e: any) {
        // Si el usuario no tiene permisos o aún no hay favoritos, ignoramos
        // Alert.alert("Favorites", e?.message ?? "Could not load favorites");
      }
    })();
  }, []);

  const formatCOP = (n: number) => {
    try {
      return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0,
      }).format(n);
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

  // Toggle favorito con UI optimista
  const onToggleFav = async (betId: string) => {
    // evita spams
    if (togglingFavs.has(betId)) return;

    const isFav = favIds.has(betId);
    const nextFavs = new Set(favIds);
    isFav ? nextFavs.delete(betId) : nextFavs.add(betId);

    // Optimista
    setFavIds(nextFavs);
    const nextToggling = new Set(togglingFavs);
    nextToggling.add(betId);
    setTogglingFavs(nextToggling);

    try {
      if (isFav) await removeFavorite(betId);
      else await addFavorite(betId);
    } catch (e: any) {
      // Revertimos si falla
      setFavIds(favIds);
      Alert.alert("Favorites", e?.message ?? "Could not update favorite");
    } finally {
      nextToggling.delete(betId);
      setTogglingFavs(new Set(nextToggling));
    }
  };

  const confirmPlace = async () => {
    if (!selectedBet || !selectedOpt) return;
    const raw = stake.replace(/[^\d.,]/g, "").replace(",", ".");
    const amt = Number(raw);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert("Invalid amount", "Enter a positive number.");
      return;
    }

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
      setBusyAction(true); // overlay mientras corre el RPC
      const { error } = await supabase.rpc("place_wager", {
        p_bet_id: selectedBet.id,
        p_option_id: selectedOpt.id,
        p_stake: amt,
      });
      if (error) throw error;
      setShowModal(false);
      Alert.alert(
        "Placed!",
        `You placed ${formatCOP(amt)} at ${selectedOpt.odds.toFixed(2)}.`
      );
      // Opcional: recargar apuestas/transacciones
      // await load();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not place bet");
    } finally {
      setBusyAction(false);
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async () => {
                setRefreshing(true);
                try {
                  await load();
                  // refrescar favoritos también si quieres:
                  const ids = await listMyFavoriteIds();
                  setFavIds(new Set(ids));
                } finally {
                  setRefreshing(false);
                }
              }}
              tintColor={palette.accent}
              progressBackgroundColor={palette.inputBg}
              colors={[palette.accent]}
            />
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
            <QuickAction icon="receipt-long" label="My Bets" onPress={() => useRouter().push("/main/my-bets")} />
            <QuickAction icon="search" label="Explore" onPress={() => {}} />
          </View>

          {/* Open bets */}
          <Text style={styles.sectionTitle}>Open bets</Text>

          {bets.length === 0 && (
            <View style={[styles.card, { alignItems: "center" }]}>
              <Text style={{ color: palette.muted }}>No open bets available.</Text>
            </View>
          )}

          {bets.map((bet) => {
            const isFav = favIds.has(bet.id);
            const isBusy = togglingFavs.has(bet.id);
            return (
              <View key={bet.id} style={[styles.card, { marginBottom: 12 }]}>
                {/* Botón favorito (esquina superior derecha) */}
                <View style={styles.favWrap}>
                  <Pressable
                    onPress={() => onToggleFav(bet.id)}
                    disabled={isBusy}
                    style={({ pressed }) => [
                      styles.favBtn,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                    ]}
                    accessibilityLabel={isFav ? "Remove from favorites" : "Add to favorites"}
                    accessibilityHint="Toggle favorite"
                  >
                    <MaterialIcons
                      name={isFav ? "favorite" : "favorite-border"}
                      size={18}
                      color={isFav ? palette.accent : palette.muted}
                    />
                  </Pressable>
                </View>

                <View style={{ flexDirection: "row", gap: 12 }}>
                  {/* Imagen (si existe) */}
                  {bet.image_url ? (
                    <Image source={{ uri: bet.image_url }} style={styles.betImg} />
                  ) : (
                    <View
                      style={[
                        styles.betImg,
                        {
                          backgroundColor: "#0f2a3c",
                          borderWidth: 1,
                          borderColor: "#18445c",
                        },
                      ]}
                    />
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.matchTeams}>{bet.title}</Text>
                    {bet.description ? (
                      <Text style={styles.matchMeta} numberOfLines={2}>
                        {bet.description}
                      </Text>
                    ) : null}
                    <View style={{ height: 6 }} />
                    {/* Odds */}
                    <View style={styles.oddsRow}>
                      {bet.bet_options?.map((o) => (
                        <OddChip
                          key={o.id}
                          label={o.label}
                          value={o.odds}
                          onPress={() => openPlaceModal(bet, o)}
                        />
                      ))}
                    </View>
                    {/* Min/Max stake info */}
                    <Text style={[styles.matchMeta, { marginTop: 6 }]}>
                      Min {formatCOP(Number(bet.stake_min ?? 0))}
                      {bet.stake_max != null
                        ? ` · Max ${formatCOP(Number(bet.stake_max))}`
                        : ""}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}

          {/* --- Mini-game: Coin Flip (debajo de Open bets) --- */}
          <CoinFlipGame />

          {/* Banner / promo */}
          <View style={styles.promo}>
            <View style={styles.promoLeft}>
              <Text style={styles.promoTitle}>Bet Boost</Text>
              <Text style={styles.promoText}>
                +15% on 3+ selections. Limited time.
              </Text>
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
        <Modal
          visible={showModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowModal(false)}
        >
          <View style={styles.modalWrap}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Place bet</Text>
              <Text style={styles.modalHint}>
                {selectedBet?.title} · {selectedOpt?.label} @ {selectedOpt?.odds.toFixed(2)}
              </Text>
              {selectedBet && (
                <Text style={[styles.modalHint, { marginTop: 2 }]}>
                  Min {formatCOP(Number(selectedBet.stake_min ?? 0))}
                  {selectedBet.stake_max != null
                    ? ` · Max ${formatCOP(Number(selectedBet.stake_max))}`
                    : ""}
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
                <Pressable
                  onPress={() => setShowModal(false)}
                  style={({ pressed }) => [
                    styles.ghostBtn,
                    pressed && { opacity: 0.9 },
                    { flex: 1 },
                  ]}
                >
                  <MaterialIcons name="close" size={18} color={palette.muted} />
                  <Text style={styles.ghostBtnText}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={confirmPlace}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.9 },
                    { flex: 1 },
                  ]}
                >
                  <MaterialIcons name="check-circle" size={18} color="#fff" />
                  <Text style={styles.primaryBtnText}>Confirm</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      {/* Overlay global de carga (ruleta Lottie) */}
      <LoadingOverlay
        visible={screenLoading || busyAction}
        message={screenLoading ? "Recargando la página..." : "Procesando..."}
        lockUntil="cycle"
      />
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
    <Pressable
      style={({ pressed }) => [styles.qa, pressed && { opacity: 0.9 }]}
      onPress={onPress}
    >
      <MaterialIcons name={icon} size={22} color={palette.text} />
      <Text style={styles.qaLabel}>{label}</Text>
    </Pressable>
  );
}

function OddChip({
  label,
  value,
  onPress,
}: {
  label: string;
  value: number;
  onPress: () => void;
}) {
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
  sectionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 10,
  },

  /* Card de apuesta */
  card: {
    position: "relative",
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 12,
  },
  betImg: {
    width: 86,
    height: 86,
    borderRadius: 12,
    backgroundColor: "#0f2a3c",
  },

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

  // Corazón
  favWrap: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
  },
  favBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(17,46,65,0.9)",
    borderWidth: 1,
    borderColor: "#18445c",
    alignItems: "center",
    justifyContent: "center",
  },

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
  promoImg: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: "#0f2a3c",
  },

  /* Buttons compartidos (modal) */
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: palette.accent,
    paddingVertical: 12,
    borderRadius: 12,
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
  modalWrap: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: { color: palette.text, fontWeight: "900", fontSize: 16, marginBottom: 6 },
  modalHint: { color: palette.muted },
  modalInput: {
    marginTop: 6,
    backgroundColor: "#0e1b26",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
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

  /* Coin Flip card */
  coinCard: {
    marginTop: 16,
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 16,
  },
  coinTitle: { color: palette.text, fontWeight: "900", fontSize: 16 },
  coinHint: { color: palette.muted, marginTop: 4 },

  coinChoiceRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    marginBottom: 6,
  },
  coinChip: {
    flex: 1,
    backgroundColor: "#112e41",
    borderWidth: 1,
    borderColor: "#18445c",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  coinChipActive: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  coinChipText: { color: "#9bb7c6", fontWeight: "800" },
  coinChipTextActive: { color: "#0b1220" },

  coinAnimWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
  },

  resultText: {
    textAlign: "center",
    fontWeight: "900",
    fontSize: 16,
    marginTop: 6,
  },
});
