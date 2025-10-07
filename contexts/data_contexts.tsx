import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../utils/supabase";
import { useAuth } from "./Auth_contexts";

export type ProfileLite = {
  id: string;
  name: string | null;
  username: string | null;
  avatar_url?: string | null;
};

export type Chat = {
  id: string;
  user_id: string;
  user_id2: string;
  created_at: string;
  updated_at: string;
};

export type ChatJoined = Chat & {
  user1?: ProfileLite | null;
  user2?: ProfileLite | null;
};

export type Message = {
  id: string;
  text: string;
  sent_by: string;
  chat_id: string;
  created_at: string;
  media?: any;
};

type AddChatResult = { chat: Chat | null; error: string | null };

interface DataContextType {
  chats: ChatJoined[];
  messages: Message[];
  currentChatId: string | null;
  setCurrentChatId: (id: string | null) => void;

  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, text: string, media?: any) => Promise<void>;
  addChat: (userId2: string) => Promise<AddChatResult>;

  // 👇 NUEVO: para pushear mensajes entrantes del canal de la pantalla
  addMessage: (msg: Message) => void;
}

const defaultData: DataContextType = {
  chats: [],
  messages: [],
  currentChatId: null,
  setCurrentChatId: () => {},
  fetchChats: async () => {},
  fetchMessages: async () => {},
  sendMessage: async () => {},
  addChat: async () => ({ chat: null, error: "DataProvider not mounted" }),
  addMessage: () => {},
};

const DataContext = createContext<DataContextType>(defaultData);
export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [chats, setChats] = useState<ChatJoined[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const currentChatIdRef = useRef<string | null>(null);
  useEffect(() => { currentChatIdRef.current = currentChatId; }, [currentChatId]);

  // 👇 NUEVO: push local sin duplicados
  const addMessage = (msg: Message) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  };

  // ---------- QUERIES ----------
  const fetchChats = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("chats")
      .select(`
        id, user_id, user_id2, created_at, updated_at,
        user1:profiles!chats_user_id_fkey ( id, name, username, avatar_url ),
        user2:profiles!chats_user_id2_fkey ( id, name, username, avatar_url )
      `)
      .or(`user_id.eq.${user.id},user_id2.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      if (__DEV__) console.warn("fetchChats error:", error.message);
      return;
    }

    const rows: ChatJoined[] = (data ?? []).map((r: any) => ({
      id: r.id,
      user_id: r.user_id,
      user_id2: r.user_id2,
      created_at: r.created_at,
      updated_at: r.updated_at,
      user1: Array.isArray(r.user1) ? (r.user1[0] ?? null) : (r.user1 ?? null),
      user2: Array.isArray(r.user2) ? (r.user2[0] ?? null) : (r.user2 ?? null),
    }));

    setChats(rows);
  };

  const fetchMessages = async (chatId: string) => {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (error) {
      if (__DEV__) console.warn("fetchMessages error:", error.message);
      return;
    }
    setMessages(data ?? []);
  };

  const sendMessage = async (chatId: string, text: string, media?: any) => {
    if (!user || !text.trim()) return;
    const { error } = await supabase
      .from("messages")
      .insert([{ text, sent_by: user.id, chat_id: chatId, media }]);

    if (error) {
      if (__DEV__) console.warn("sendMessage error:", error.message);
      return;
    }
    await fetchMessages(chatId);
  };

  const addChat = async (userId2: string): Promise<AddChatResult> => {
    if (!user) return { chat: null, error: "Not authenticated" };
    if (user.id === userId2) return { chat: null, error: "You cannot chat with yourself." };

    const { data: existing, error: findErr } = await supabase
      .from("chats")
      .select("id, user_id, user_id2, created_at, updated_at")
      .or(
        `and(user_id.eq.${user.id},user_id2.eq.${userId2}),and(user_id.eq.${userId2},user_id2.eq.${user.id})`
      )
      .limit(1);

    if (findErr) console.warn("find chat error:", findErr);
    if (existing && existing.length > 0) {
      return { chat: existing[0] as Chat, error: null };
    }

    const { data, error } = await supabase
      .from("chats")
      .insert([{ user_id: user.id, user_id2: userId2 }])
      .select()
      .single();

    if (error) {
      console.warn("addChat error:", error);
      return { chat: null, error: error.message };
    }

    await fetchChats();
    return { chat: data as Chat, error: null };
  };

  // ---------- REALTIME ----------
  useEffect(() => {
    if (!user) return;

    // ❌ quitamos el canal global de messages para evitar duplicados
    // ✅ dejamos solo el canal de chats (para refrescar lista)
    const chatsChannel = supabase
      .channel("realtime:chats")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chats" },
        (payload) => {
          const row = (payload.new ?? payload.old) as Chat;
          if (row?.user_id === user.id || row?.user_id2 === user.id) {
            fetchChats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chatsChannel);
    };
  }, [user]);

  useEffect(() => {
    if (user) fetchChats();
    else {
      setChats([]);
      setMessages([]);
      setCurrentChatId(null);
    }
  }, [user]);

  return (
    <DataContext.Provider
      value={{
        chats,
        messages,
        currentChatId,
        setCurrentChatId,
        fetchChats,
        fetchMessages,
        sendMessage,
        addChat,
        addMessage, // 👈 expuesto
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
