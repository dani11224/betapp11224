import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuroraBackground, Logo, palette } from "../../components/Brand";

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AuroraBackground />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero con logo */}
          <View style={styles.hero}>
            <Logo />
            <Text style={styles.subtitle}>Welcome back</Text>
            <Text style={styles.helper}>
              Check live matches, hot odds and your slips—all in one place.
            </Text>
          </View>

          {/* Acciones rápidas */}
          <View style={styles.quickRow}>
            <QuickAction
              icon="live-tv"
              label="Live"
              onPress={() => {}}
            />
            <QuickAction
              icon="bolt"
              label="Boosts"
              onPress={() => {}}
            />
            <QuickAction
              icon="receipt-long"
              label="My Bets"
              onPress={() => {}}
            />
            <QuickAction
              icon="search"
              label="Explore"
              onPress={() => {}}
            />
          </View>

          {/* Destacados del día */}
          <Text style={styles.sectionTitle}>Today’s Highlights</Text>
          <View style={styles.card}>
            <MatchRow
              leftTeam="FC Red"
              rightTeam="Blue United"
              time="18:30"
              league="Premier League"
              odds={{ home: 1.95, draw: 3.2, away: 3.8 }}
            />
            <Divider />
            <MatchRow
              leftTeam="Roma"
              rightTeam="Milan"
              time="19:45"
              league="Serie A"
              odds={{ home: 2.2, draw: 3.1, away: 3.2 }}
            />
            <Pressable style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>See all matches</Text>
            </Pressable>
          </View>

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

          {/* Últimos resultados (placeholder) */}
          <Text style={styles.sectionTitle}>Latest Results</Text>
          <View style={styles.resultsRow}>
            <ResultPill home="Ajax" away="PSV" score="2–1" />
            <ResultPill home="Barça" away="Sevilla" score="3–0" />
            <ResultPill home="Inter" away="Lazio" score="1–1" />
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
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
    <Pressable style={({ pressed }) => [styles.qa, pressed && { opacity: 0.9 }] } onPress={onPress}>
      <MaterialIcons name={icon} size={22} color={palette.text} />
      <Text style={styles.qaLabel}>{label}</Text>
    </Pressable>
  );
}

function MatchRow({
  leftTeam,
  rightTeam,
  time,
  league,
  odds,
}: {
  leftTeam: string;
  rightTeam: string;
  time: string;
  league: string;
  odds: { home: number; draw: number; away: number };
}) {
  return (
    <View style={styles.matchRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.matchTeams}>{leftTeam} vs {rightTeam}</Text>
        <Text style={styles.matchMeta}>{league} · {time}</Text>
      </View>
      <View style={styles.oddsRow}>
        <OddChip label="1" value={odds.home} />
        <OddChip label="X" value={odds.draw} />
        <OddChip label="2" value={odds.away} />
      </View>
    </View>
  );
}

function OddChip({ label, value }: { label: string; value: number }) {
  return (
    <Pressable style={styles.oddChip}>
      <Text style={styles.oddLabel}>{label}</Text>
      <Text style={styles.oddValue}>{value.toFixed(2)}</Text>
    </Pressable>
  );
}

function ResultPill({ home, away, score }: { home: string; away: string; score: string }) {
  return (
    <View style={styles.resultPill}>
      <Text style={styles.resultText}>{home}</Text>
      <Text style={styles.resultScore}>{score}</Text>
      <Text style={styles.resultText}>{away}</Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

/* --- Estilos --- */
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    padding: 20,
    paddingBottom: 32,
  },

  /* Hero */
  hero: {
    alignItems: "center",
    marginBottom: 6,
  },
  subtitle: {
    color: palette.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  helper: {
    color: palette.muted,
    textAlign: "center",
    marginTop: 6,
  },

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
  qaLabel: {
    color: palette.text,
    fontWeight: "700",
    marginTop: 6,
  },

  /* Secciones */
  sectionTitle: {
    color: palette.text,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 10,
  },

  /* Card de partidos */
  card: {
    backgroundColor: palette.inputBg,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 12,
  },
  matchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  matchTeams: {
    color: palette.text,
    fontWeight: "700",
  },
  matchMeta: {
    color: palette.muted,
    marginTop: 2,
  },
  oddsRow: {
    flexDirection: "row",
    gap: 8,
  },
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

  divider: {
    height: 1,
    backgroundColor: "#143a51",
    marginVertical: 8,
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

  /* Chip primario */
  primaryBtn: {
    marginTop: 10,
    backgroundColor: palette.accent,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
  },

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

  /* Result pills */
  resultsRow: {
    flexDirection: "row",
    gap: 10,
  },
  resultPill: {
    flex: 1,
    backgroundColor: "#0f2a3c",
    borderWidth: 1,
    borderColor: "#18445c",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  resultText: { color: "#cfe5f0", fontWeight: "700" },
  resultScore: { color: "#fff", fontWeight: "900", marginVertical: 2 },
});