import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(30);
    setNotifications(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel("notifications-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, (payload) => {
        setNotifications((prev) => [payload.new, ...prev]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  async function markRead(id) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).in("id", unreadIds);
  }

  const value = { notifications, unreadCount, loading, markRead, markAllRead };
  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
