// lib/bets.ts
import { supabase } from "../../utils/supabase"; // <- ajusta si tu cliente está en otra ruta

export type NewBet = {
  title: string;
  description?: string;
  baseCost: number; 
  stakeMin?: number;
  stakeMax?: number | null;
  opensAt?: string | null;
  closesAt?: string | null;
};
export type NewOption = { label: string; odds: number };

export async function createBetWithOptions(
  fields: NewBet,
  options: NewOption[],
  imageUri?: string | null
) {
  // 1) crear bet + opciones (RPC)
  const { data: betId, error } = await supabase.rpc("create_bet_with_options", {
    p_title: fields.title,
    p_description: fields.description ?? null,
    p_base_cost: fields.baseCost,
    p_stake_min: fields.stakeMin ?? 0,
    p_stake_max: fields.stakeMax ?? null,
    p_opens_at: fields.opensAt ?? null,
    p_closes_at: fields.closesAt ?? null,
    p_image_url: null,
    p_options: options as any,
  });
  if (error) throw error;

  // 2) subir imagen (opcional) al bucket bet-images y actualizar image_url
  if (imageUri) {
    const resp = await fetch(imageUri);
    const blob = await resp.blob();
    const ext = (imageUri.split(".").pop() || "jpg").toLowerCase();
    const path = `${betId}/main.${ext}`;

    const { error: upErr } = await supabase
      .storage.from("bet-images")
      .upload(path, blob, { upsert: true, contentType: blob.type });
    if (upErr) throw upErr;

    const { data } = await supabase.storage.from("bet-images").getPublicUrl(path);
    await supabase.from("bets").update({ image_url: data.publicUrl }).eq("id", betId);
  }

  return betId as string;
}

export function listOpenBets() {
  return supabase
    .from("bets")
    .select(
      "id,title,description,image_url,base_cost,stake_min,stake_max,status,opens_at,closes_at,bet_options(id,label,odds)"
    )
    .order("created_at", { ascending: false });
}

export async function placeWager(betId: string, optionId: string, stake: number) {
  const { data, error } = await supabase.rpc("place_wager", {
    p_bet_id: betId,
    p_option_id: optionId,
    p_stake: stake,
  });
  if (error) throw error;
  return data as string;
}
