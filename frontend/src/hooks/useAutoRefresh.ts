"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Recharge une ressource au retour dans l'application, à la reconnexion et toutes les
 * 30 secondes tant que l'écran est visible. Les données déjà affichées restent en place.
 */
export function useAutoRefresh(load: () => Promise<void>, intervalMs = 30_000) {
  const loadRef = useRef(load);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  useEffect(() => { loadRef.current = load; }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try { await loadRef.current(); setLastUpdated(new Date()); }
    finally { setRefreshing(false); setHasLoaded(true); }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refresh(), 0);
    const refreshWhenVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const refreshWhenOnline = () => void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible" && navigator.onLine) void refresh(); }, intervalMs);
    window.addEventListener("focus", refreshWhenVisible);
    window.addEventListener("online", refreshWhenOnline);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => { window.clearTimeout(initialRefresh); window.clearInterval(timer); window.removeEventListener("focus", refreshWhenVisible); window.removeEventListener("online", refreshWhenOnline); document.removeEventListener("visibilitychange", refreshWhenVisible); };
  }, [intervalMs, refresh]);

  return { refresh, refreshing, lastUpdated, hasLoaded };
}
