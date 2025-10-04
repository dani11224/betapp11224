// utils/profiles.ts
import { supabase } from "@/utils/supabase";

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  location: string | null;
  birth_date: string | null; // YYYY-MM-DD (DATE en el esquema)
  phone: string | null;
  gender: string | null;
  role: string | null;
  points?: number | null;
  is_verified?: boolean | null;
  last_active?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function scrub(val: any) {
  if (typeof val === "string") {
    const t = val.trim();
    return t.length ? t : null;
  }
  return val;
}

// Solo deja pasar keys válidas y limpia strings
function pickClean(values: Partial<Profile>) {
  const allowed: (keyof Profile)[] = [
    "email",
    "name",
    "username",
    "avatar_url",
    "bio",
    "website",
    "location",
    "birth_date",
    "phone",
    "gender",
    "role",
  ];
  const out: Record<string, any> = {};
  for (const k of allowed) {
    if (k in values) out[k] = scrub(values[k]);
  }
  return out;
}

export async function fetchMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id,email,name,username,avatar_url,bio,website,location,birth_date,phone,gender,role,points,is_verified,last_active,created_at,updated_at"
    )
    .eq("id", userId)
    .maybeSingle(); // puede no existir aún

  if (error) throw error;
  return (data ?? null) as Profile | null;
}

export async function saveMyProfile(userId: string, values: Partial<Profile>) {
  // 1) Ver si ya existe la fila
  const existing = await fetchMyProfile(userId); // null si no existe

  // 2) Normalizar y preparar payload “seguro”
  const cleaned = pickClean(values);

  // fecha para updated_at
  const now = new Date().toISOString();

  if (existing) {
    // 3A) UPDATE (no requiere email ni name NOT NULL si no los tocas)
    const payload = {
      ...cleaned,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  } else {
    // 3B) INSERT (requiere email y name por NOT NULL)
    const emailFinal = (cleaned.email ?? null) as string | null;
    const nameFinal = (cleaned.name ?? null) as string | null;

    if (!emailFinal) {
      throw new Error(
        "No existe fila en profiles y falta 'email' para crearla. Pásalo en saveMyProfile o crea la fila al registrarte."
      );
    }
    if (!nameFinal) {
      throw new Error(
        "No existe fila en profiles y falta 'name' para crearla. Completa el nombre en el formulario."
      );
    }

    const payload = {
      id: userId,
      email: emailFinal,
      name: nameFinal,
      username: cleaned.username ?? null,
      avatar_url: cleaned.avatar_url ?? null,
      bio: cleaned.bio ?? null,
      website: cleaned.website ?? null,
      location: cleaned.location ?? null,
      birth_date: cleaned.birth_date ?? null, // 'YYYY-MM-DD' está bien para DATE
      phone: cleaned.phone ?? null,
      gender: cleaned.gender ?? null,
      role: cleaned.role ?? "CLIENT", // asigna un rol por defecto
      updated_at: now,
      // created_at lo pone DEFAULT NOW()
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Profile;
  }
}
