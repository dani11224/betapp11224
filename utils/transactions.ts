// utils/transactions.ts
import { supabase } from "@/utils/supabase";

export type WalletTx = {
  id: string;
  type: "DEPOSIT" | "WITHDRAW" | "BET" | "PAYOUT" | "ADJUSTMENT";
  label: string | null;
  amount: number;
  balance_after: number;
  created_at: string;
};

export async function fetchMyTransactions(limit = 50) {
  const { data, error } = await supabase
    .from("wallet_transactions")
    .select("id,type,label,amount,balance_after,created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as WalletTx[];
}
