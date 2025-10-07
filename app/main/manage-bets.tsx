// app/main/manage-bets.tsx
import { supabase } from "@/utils/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { AuroraBackground, palette } from "../../components/Brand";
import LoadingOverlay from "../../components/LoadingOverlay";

/* ========= Helpers ========= */
const first = <T,>(x: T | T[] | null | undefined): T | null =>
  Array.isArray(x) ? (x[0] ?? null) : (x ?? null);

const fmtDate = (iso?: string | null) => (iso ? new Date(iso).toLocaleString() : "—");

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
  created_at?: string;
  bet_options: BetOption[];
};
type BetDB = Omit<Bet, "bet_options"> & {
  bet_options: BetOption[] | BetOption[][];
  favs?: { count: number }[]; // agregador
};

type FavoriteUser = {
  when: string;
  id: string;
  name: string;
  email?: string | null;
  avatar_url?: string | null;
};

export default function ManageBetsScreen() {
  const router = useRouter();

  // UI state
  const [screenLoading, setScreenLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // data
  const [bets, setBets] = useState<(Bet & { favCount: number })[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Bet["status"] | "ALL">("OPEN");

  // modals
  const [editOf, setEditOf] = useState<Bet | null>(null);
  const [favModal, setFavModal] = useState<{ betId: string; users: FavoriteUser[] } | null>(null);

  const load = useCallback(async () => {
    try {
      if (!refreshing) setScreenLoading(true);

      let select = supabase
        .from("bets")
        .select(`
          id,title,description,image_url,base_cost,stake_min,stake_max,status,opens_at,closes_at,created_at,
          bet_options:bet_options!bet_options_bet_id_fkey(id,label,odds),
          favs:bet_favorites!bet_favorites_bet_id_fkey(count)
        `)
        .order("created_at", { ascending: false });

      if (status !== "ALL") select = select.eq("status", status);
      if (query.trim()) select = select.ilike("title", `%${query.trim()}%`);

      const { data, error } = await select;
      if (error) throw error;

      const norm = (data ?? []).map((row: BetDB) => {
        const favCount = row.favs?.[0]?.count ?? 0;
        const options = (Array.isArray(row.bet_options) && Array.isArray(row.bet_options[0]))
          ? (row.bet_options as BetOption[][])[0]
          : (row.bet_options as BetOption[]);

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          image_url: row.image_url,
          base_cost: row.base_cost,
          stake_min: row.stake_min,
          stake_max: row.stake_max,
          status: row.status,
          opens_at: row.opens_at,
          closes_at: row.closes_at,
          created_at: row.created_at,
          bet_options: options ?? [],
          favCount,
        };
      });

      setBets(norm);
    } catch (e: any) {
      Alert.alert("Manage Bets", e?.message ?? "Could not load bets");
    } finally {
      setScreenLoading(false);
    }
  }, [refreshing, query, status]);

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

  /* ======= actions ======= */
  const openEdit = (bet: Bet) => setEditOf(bet);

  const saveEdit = async (draft: Bet) => {
    try {
      setBusy(true);
      const { error } = await supabase
        .from("bets")
        .update({
          title: draft.title,
          description: draft.description,
          base_cost: draft.base_cost,
          stake_min: draft.stake_min,
          stake_max: draft.stake_max,
          opens_at: draft.opens_at,
          closes_at: draft.closes_at,
        })
        .eq("id", draft.id);
      if (error) throw error;
      setEditOf(null);
      await load();
    } catch (e: any) {
      Alert.alert("Edit bet", e?.message ?? "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (betId: string, newStatus: Bet["status"]) => {
    try {
      setBusy(true);
      const { error } = await supabase.from("bets").update({ status: newStatus }).eq("id", betId);
      if (error) throw error;
      await load();
    } catch (e: any) {
      Alert.alert("Status", e?.message ?? "Could not update status");
    } finally {
      setBusy(false);
    }
  };

  const viewFavorites = async (betId: string) => {
    try {
      setBusy(true);
      const { data, error } = await supabase
        .from("bet_favorites")
        .select(`
          created_at,
          user:profiles!bet_favorites_user_id_fkey(id, username, full_name, email, avatar_url)
        `)
        .eq("bet_id", betId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const users: FavoriteUser[] = (data ?? []).map((r: any) => {
        const u = first(r.user) ?? r.user; // por si llega como array
        return {
          when: r.created_at,
          id: u?.id ?? "—",
          name: u?.full_name ?? u?.username ?? "Unknown",
          email: u?.email ?? null,
          avatar_url: u?.avatar_url ?? null,
        };
      });

      setFavModal({ betId, users });
    } catch (e: any) {
      Alert.alert("Favorites", e?.message ?? "Could not load favorites");
    } finally {
      setBusy(false);
    }
  };

  // derived
  const total = useMemo(() => bets.length, [bets]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AuroraBackground />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={palette.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Manage Bets</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Filters */}
        <View style={styles.filters}>
          <View style={styles.searchBox}>
            <MaterialIcons name="search" size={18} color={palette.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search title..."
              placeholderTextColor={palette.muted}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={load}
            />
            {!!query && (
              <Pressable onPress={() => { setQuery(""); load(); }}>
                <MaterialIcons name="close" size={18} color={palette.muted} />
              </Pressable>
            )}
          </View>

          <View style={styles.statusRow}>
            {(["ALL","OPEN","CLOSED","CANCELLED","SETTLED"] as const).map(s => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[styles.tag, status === s && styles.tagActive]}
              >
                <Text style={[styles.tagText, status === s && styles.tagTextActive]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
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
        >
          <Text style={styles.sectionTitle}>Total: {total}</Text>

          {bets.length === 0 ? (
            <View style={[styles.card, { alignItems: "center" }]}>
              <Text style={{ color: palette.muted }}>No bets found.</Text>
            </View>
          ) : (
            bets.map((bet) => (
              <View key={bet.id} style={[styles.card, { marginBottom: 12 }]}>
                <View style={{ flexDirection: "row", gap: 12 }}>
                  {bet.image_url ? (
                    <Image source={{ uri: bet.image_url }} style={styles.betImg} />
                  ) : (
                    <View style={[styles.betImg, styles.imgPlaceholder]} />
                  )}

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={styles.title} numberOfLines={1}>{bet.title}</Text>
                      <View style={styles.favCount}>
                        <MaterialIcons name="favorite" size={14} color={palette.accent} />
                        <Text style={styles.favCountText}>{bet.favCount}</Text>
                      </View>
                    </View>

                    <Text style={styles.meta} numberOfLines={2}>{bet.description ?? "—"}</Text>
                    <Text style={styles.meta2}>
                      Base {formatCOP(bet.base_cost)} · Min {formatCOP(Number(bet.stake_min ?? 0))}
                      {bet.stake_max != null ? ` · Max ${formatCOP(Number(bet.stake_max))}` : ""}
                    </Text>
                    <Text style={styles.meta2}>Opens {fmtDate(bet.opens_at)} · Closes {fmtDate(bet.closes_at)}</Text>

                    {/* options */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
                      {bet.bet_options.map((o) => (
                        <View key={o.id} style={styles.oddChip}>
                          <Text style={styles.oddLabel}>{o.label}</Text>
                          <Text style={styles.oddValue}>{o.odds.toFixed(2)}</Text>
                        </View>
                      ))}
                    </View>

                    {/* actions */}
                    <View style={styles.actions}>
                    {/* Fila superior: acciones de edición */}
                    <View style={styles.actionsTopRow}>
                        <Pressable style={styles.ghostBtn} onPress={() => openEdit(bet)}>
                        <MaterialIcons name="edit" size={16} color={palette.text} />
                        <Text style={styles.ghostBtnText}>Edit</Text>
                        </Pressable>

                        <Pressable style={styles.ghostBtn} onPress={() => viewFavorites(bet.id)}>
                        <MaterialIcons name="people" size={16} color={palette.text} />
                        <Text style={styles.ghostBtnText}>Favorites</Text>
                        </Pressable>
                    </View>

                    {/* Fila inferior: estado */}
                    <View style={styles.actionsBottomRow}>
                        {bet.status !== "OPEN" && (
                        <Pressable style={styles.primaryBtn} onPress={() => changeStatus(bet.id, "OPEN")}>
                            <Text style={styles.primaryBtnText}>Open</Text>
                        </Pressable>
                        )}
                        {bet.status === "OPEN" && (
                        <Pressable style={styles.warnBtn} onPress={() => changeStatus(bet.id, "CLOSED")}>
                            <Text style={styles.warnBtnText}>Close</Text>
                        </Pressable>
                        )}
                        {bet.status !== "CANCELLED" && (
                        <Pressable
                            style={styles.dangerBtn}
                            onPress={() =>
                            Alert.alert("Cancel bet","This will cancel the market.",
                                [{ text:"No" }, { text:"Yes, cancel", style:"destructive", onPress:()=>changeStatus(bet.id,"CANCELLED")}]
                            )
                            }
                        >
                            <Text style={styles.dangerBtnText}>Cancel</Text>
                        </Pressable>
                        )}
                    </View>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>

      {/* Edit modal */}
      <EditBetModal
        bet={editOf}
        onClose={() => setEditOf(null)}
        onSave={saveEdit}
        formatCOP={formatCOP}
      />

      {/* Favorites modal */}
      <FavoritesModal modal={favModal} onClose={() => setFavModal(null)} />

      <LoadingOverlay visible={screenLoading || busy} message={screenLoading ? "Loading..." : "Working..."} lockUntil="cycle" />
    </SafeAreaView>
  );
}

/* ======= Modals ======= */
function EditBetModal({
  bet,
  onClose,
  onSave,
  formatCOP,
}: {
  bet: Bet | null;
  onClose: () => void;
  onSave: (draft: Bet) => void;
  formatCOP: (n: number) => string;
}) {
  const [draft, setDraft] = useState<Bet | null>(null);

  useEffect(() => { setDraft(bet); }, [bet]);
  if (!draft) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={mstyles.wrap}>
        <View style={mstyles.card}>
          <Text style={mstyles.title}>Edit bet</Text>
          <TextInput
            value={draft.title}
            onChangeText={(t) => setDraft({ ...draft, title: t })}
            placeholder="Title"
            placeholderTextColor={palette.muted}
            style={mstyles.input}
          />
          <TextInput
            value={draft.description ?? ""}
            onChangeText={(t) => setDraft({ ...draft, description: t })}
            placeholder="Description"
            placeholderTextColor={palette.muted}
            style={[mstyles.input, { height: 80 }]}
            multiline
          />
          <View style={mstyles.row}>
            <Field label="Base" value={String(draft.base_cost)} onChange={(t) => setDraft({ ...draft, base_cost: Number(t) || 0 })} />
            <Field label="Min"  value={String(draft.stake_min ?? 0)} onChange={(t) => setDraft({ ...draft, stake_min: Number(t) || 0 })} />
            <Field label="Max"  value={draft.stake_max == null ? "" : String(draft.stake_max)} onChange={(t) => setDraft({ ...draft, stake_max: t === "" ? null : (Number(t) || 0) })} />
          </View>
          <View style={mstyles.row}>
            <Field label="Opens at (ISO)" value={draft.opens_at ?? ""} onChange={(t) => setDraft({ ...draft, opens_at: t || null })} />
            <Field label="Closes at (ISO)" value={draft.closes_at ?? ""} onChange={(t) => setDraft({ ...draft, closes_at: t || null })} />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <Pressable onPress={onClose} style={[mstyles.ghostBtn, { flex: 1 }]}>
              <Text style={mstyles.ghostBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={() => onSave(draft)} style={[mstyles.primaryBtn, { flex: 1 }]}>
              <Text style={mstyles.primaryBtnText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (t: string) => void }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={mstyles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor={palette.muted}
        style={mstyles.input}
      />
    </View>
  );
}

function FavoritesModal({ modal, onClose }: { modal: { betId: string; users: FavoriteUser[] } | null; onClose: () => void }) {
  if (!modal) return null;
  const { users } = modal;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={mstyles.wrap}>
        <View style={mstyles.card}>
          <Text style={mstyles.title}>Favorites</Text>

          {users.length === 0 ? (
            <Text style={{ color: palette.muted }}>No users have favorited this bet.</Text>
          ) : (
            <ScrollView style={{ maxHeight: 380 }}>
              {users.map((u) => (
                <View key={u.id + u.when} style={favStyles.row}>
                  <View style={favStyles.avatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={favStyles.name}>{u.name}</Text>
                    <Text style={favStyles.meta}>{u.email ?? "—"} · {new Date(u.when).toLocaleString()}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <Pressable onPress={onClose} style={[mstyles.primaryBtn, { marginTop: 12 }]}>
            <Text style={mstyles.primaryBtnText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ======= Estilos ======= */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, paddingBottom: 32 },

  header: {
    height: 52,
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, marginBottom: 6,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    backgroundColor: palette.inputBg, borderWidth: 1, borderColor: palette.border,
  },
  headerTitle: { flex: 1, textAlign: "center", color: palette.text, fontSize: 18, fontWeight: "800" },

  filters: { paddingHorizontal: 16, marginBottom: 6 },
  searchBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: palette.inputBg, borderWidth: 1, borderColor: palette.border,
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 8,
  },
  searchInput: { flex: 1, color: palette.text },

  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  tag: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: "#0f2a3c", borderWidth: 1, borderColor: "#18445c",
  },
  tagActive: { backgroundColor: "#123f57" },
  tagText: { color: palette.muted, fontWeight: "800", fontSize: 12 },
  tagTextActive: { color: "#fff" },

  sectionTitle: { color: palette.text, fontSize: 16, fontWeight: "800", marginTop: 10, marginBottom: 10 },

  card: {
    backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 18, padding: 12,
  },
  betImg: { width: 86, height: 86, borderRadius: 12, backgroundColor: "#0f2a3c" },
  imgPlaceholder: { backgroundColor: "#0f2a3c", borderWidth: 1, borderColor: "#18445c" },

  title: { color: "#fff", fontWeight: "900", fontSize: 15 },
  meta: { color: palette.muted, marginTop: 2 },
  meta2: { color: "#9bb7c6", marginTop: 2, fontSize: 12 },

  oddChip: {
    backgroundColor: "#112e41", borderWidth: 1, borderColor: "#18445c",
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, alignItems: "center",
  },
  oddLabel: { color: "#9bb7c6", fontWeight: "700", fontSize: 12 },
  oddValue: { color: "#fff", fontWeight: "800", marginTop: 2 },

  actions: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },

  actionsTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },

  actionsBottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  ghostBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#0f2a3c", borderWidth: 1, borderColor: "#18445c",
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
  },
  ghostBtnText: { color: palette.text, fontWeight: "800" },

  primaryBtn: {
    backgroundColor: palette.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },

  warnBtn: {
    backgroundColor: "#ad7a00", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  warnBtnText: { color: "#fff", fontWeight: "900" },

  dangerBtn: {
    backgroundColor: "#9e2a2a", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  dangerBtnText: { color: "#fff", fontWeight: "900" },

  favCount: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "#0f2a3c", borderWidth: 1, borderColor: "#18445c",
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4,
  },
  favCountText: { color: "#fff", fontWeight: "800", fontSize: 12 },
});

const mstyles = StyleSheet.create({
  wrap: {
    flex: 1, padding: 20,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  card: {
    width: "100%", maxWidth: 540,
    backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 16, padding: 16,
  },
  title: { color: "#fff", fontWeight: "900", fontSize: 16, marginBottom: 10 },
  label: { color: "#9bb7c6", fontWeight: "700", fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: "#0e1b26", color: palette.text,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  ghostBtn: {
    backgroundColor: "#0f2a3c", borderWidth: 1, borderColor: "#18445c",
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center",
  },
  ghostBtnText: { color: palette.muted, fontWeight: "900" },
  primaryBtn: { backgroundColor: palette.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, alignItems: "center" },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
});

const favStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1b2e3c", borderWidth: 1, borderColor: "#18445c" },
  name: { color: "#fff", fontWeight: "800" },
  meta: { color: palette.muted, fontSize: 12, marginTop: 2 },
});
