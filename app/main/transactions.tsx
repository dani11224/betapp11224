import { fetchMyTransactions, WalletTx } from "@/utils/transactions";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { palette } from "../../components/Brand";

export default function Transactions() {
  const [txs, setTxs] = useState<WalletTx[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const rows = await fetchMyTransactions(100);
    setTxs(rows);
  }, []);

  useEffect(() => { load(); }, [load]);

  const { totalIn, totalOut } = useMemo(() => {
    let tin = 0, tout = 0;
    for (const t of txs) {
      const a = Number(t.amount || 0);
      if (a >= 0) tin += a; else tout += Math.abs(a);
    }
    return { totalIn: tin, totalOut: tout };
  }, [txs]);

  const formatCOP = (n: number) => {
    try { return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n); }
    catch { return `$ ${Math.round(n).toLocaleString("es-CO")}`; }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}                            // <- pinta fondo del scroll
          contentContainerStyle={styles.content}           // <- llena alto para evitar “arribita”
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={async () => {
              setRefreshing(true);
              try { await load(); } finally { setRefreshing(false); }
            }} />
          }
        >
          <Text style={styles.title}>Transactions</Text>

          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>In</Text>
            <Text style={styles.summaryValue}>{formatCOP(totalIn)}</Text>
            <View style={{ height: 8 }} />
            <Text style={styles.summaryLabel}>Out</Text>
            <Text style={styles.summaryValue}>{formatCOP(totalOut)}</Text>
          </View>

          {txs.map(tx => {
            const isIn = Number(tx.amount) >= 0;
            const icon = isIn ? "south_west" : "north_east";
            const amountText = `${isIn ? "+" : "−"}${formatCOP(Math.abs(Number(tx.amount)))}`;
            const date = new Date(tx.created_at).toLocaleString("es-CO");
            return (
              <View key={tx.id} style={[styles.row, { marginBottom: 10 }]}>
                <View style={styles.left}>
                  <View style={[styles.iconWrap, isIn ? styles.inBg : styles.outBg]}>
                    <MaterialIcons name={icon as any} size={18} color="#fff" />
                  </View>
                  <View>
                    <Text style={styles.label}>{tx.label || tx.type}</Text>
                    <Text style={styles.meta}>{date}</Text>
                  </View>
                </View>
                <Text style={[styles.amount, { color: isIn ? "#2e7d32" : "#b71c1c" }]}>{amountText}</Text>
              </View>
            );
          })}

          {txs.length === 0 && (
            <Text style={[styles.meta, { textAlign: "center", marginTop: 12 }]}>
              No transactions yet.
            </Text>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: palette.bg },     // <- fondo del área segura
  container: { flex: 1, backgroundColor: palette.bg },    // <- fondo del contenedor
  scroll: { flex: 1, backgroundColor: palette.bg },       // <- fondo del ScrollView
  content: { padding: 16, paddingBottom: 24, flexGrow: 1 }, // <- llenar alto para evitar gap

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
