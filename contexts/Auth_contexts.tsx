import type { Session, User } from "@supabase/supabase-js";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string
  ) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  sendPasswordReset: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cargar sesión inicial y suscribirse a cambios
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session ?? null);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login: AuthContextType["login"] = async (email, password) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return {};
    } catch (e: any) {
      return { error: e?.message ?? "Unexpected error" };
    } finally {
      setIsLoading(false);
    }
  };

    const logout: AuthContextType["logout"] = async () => {
    setIsLoading(true);
    try {
        await supabase.auth.signOut();   // cierra sesión en Supabase
    } finally {
        // limpia estado local de inmediato (no dependas solo de onAuthStateChange)
        setUser(null);
        setSession(null);
        setIsLoading(false);
    }
    };

  const register: AuthContextType["register"] = async (email, password, name) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) return { error: error.message };

      // Si Supabase requiere confirmación por email, data.session será null
      const needsConfirmation = !data.session;
      return { needsConfirmation };
    } catch (e: any) {
      return { error: e?.message ?? "Unexpected error" };
    } finally {
      setIsLoading(false);
    }
  };

  const sendPasswordReset: AuthContextType["sendPasswordReset"] = async (email) => {
    try {
      setIsLoading(true);
      // Configura tu deep link en redirectTo (p.ej. betapp://reset-password)
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "betapp://reset-password",
      });
      if (error) return { error: error.message };
      return {};
    } catch (e: any) {
      return { error: e?.message ?? "Unexpected error" };
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassword: AuthContextType["updatePassword"] = async (newPassword) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { error: error.message };
      return {};
    } catch (e: any) {
      return { error: e?.message ?? "Unexpected error" };
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, login, logout, register, sendPasswordReset, updatePassword }}
    >
      {children}
    </AuthContext.Provider>
  );
};
