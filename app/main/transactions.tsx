import { MaterialIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuroraBackground, palette } from "../../components/Brand";

type Tx = { id: string; type: "in" | "out"; label: string; date: string; amount: number };

const MOCK: Tx[] = [
  { id: "1", type: "in",  label: "PSE Deposit",         date: "2025-09-05 10:12", amount: 150000 },
  { id: "2", type: "out", label: "Bet #A-9211",          date: "2025-09-06 14:35", amount: -30000 },
  { id: "3", type: "in",  label: "Winnings ticket #88",  date: "2025-09-07 19:02", amount: 42000 },
  { id: "4", type: "out", label: "Nequi Withdrawal",     date: "2025-09-08 08:20", amount: -50000 },
];

export default function Transactions() {
  const total = useMemo(() => MOCK.reduce((s, t) => s + t.amount, 0), []);
  const fmt = (n: number) => {
    try { return new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n); }
    catch { return `$ ${Math.round(n).toLocaleString("es-CO")}`; }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <AuroraBackground />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Transactions</Text>

          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Period balance</Text>
            <Text style={[styles.summaryValue, { color: total >= 0 ? "#4caf50" : "#ff5252" }]}>
              {fmt(total)}
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            {MOCK.map(tx => (
              <View key={tx.id} style={styles.row}>
                <View style={styles.left}>
                  <View style={[styles.iconWrap, tx.type === "in" ? styles.inBg : styles.outBg]}>
                    <MaterialIcons
                      name={tx.type === "in" ? "arrow-downward" : "arrow-upward"}
                      size={16}
                      color="#fff"
                    />
                  </View>
                  <View>
                    <Text style={styles.label}>{tx.label}</Text>
                    <Text style={styles.meta}>{tx.date}</Text>
                  </View>
                </View>
                <Text style={[styles.amount, { color: tx.amount >= 0 ? "#4caf50" : "#ff5252" }]}>
                  {fmt(tx.amount)}
                </Text>
              </View>
            ))}
          </View>

          <View style={{ height: 28 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  container: { flex: 1, backgroundColor: palette.bg },
  content: { padding: 20, paddingBottom: 32 },
  title: { color: palette.text, fontSize: 18, fontWeight: "800", marginBottom: 12 },

  summary: {
    backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 16, padding: 12, marginBottom: 12,
  },
  summaryLabel: { color: palette.muted, fontWeight: "700" },
  summaryValue: { color: "#fff", fontWeight: "900", fontSize: 20, marginTop: 4 },

  row: {
    backgroundColor: palette.inputBg,
    borderWidth: 1, borderColor: palette.border,
    borderRadius: 14, padding: 12,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  inBg: { backgroundColor: "#2e7d32" },
  outBg: { backgroundColor: "#b71c1c" },
  label: { color: palette.text, fontWeight: "800" },
  meta: { color: palette.muted, fontSize: 12, marginTop: 2 },
  amount: { fontWeight: "900" },
});