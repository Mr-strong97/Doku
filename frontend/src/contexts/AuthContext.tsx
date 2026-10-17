"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { refreshAccessToken } from "@/lib/api/refresh";
import { onSessionExpired } from "@/lib/api/sessionEvents";
import {
  flushPendingLogout,
  loginMerchant,
  logoutMerchant,
  registerMerchant,
  restoreSession,
} from "@/lib/auth";
import type { AuthSession, LoginCredentials, RegisterInput } from "@/types/auth";

/**
 * loading       : on lit la session gardée sur l'appareil (quelques millisecondes)
 * authenticated : une session existe (elle fonctionne même sans Internet)
 * anonymous     : personne n'est connecté
 */
export type AuthStatus = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  /** Le serveur a refusé de renouveler la session : reconnexion nécessaire pour synchroniser. */
  sessionExpired: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthSession>;
  register: (input: RegisterInput) => Promise<AuthSession>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // 1) Au démarrage : relire la session locale. Fonctionne hors ligne.
  useEffect(() => {
    let isCancelled = false;

    async function restore() {
      const restored = await restoreSession().catch(() => null);
      if (isCancelled) return;
      // On ne touche à l'état que s'il n'a pas déjà changé (connexion très rapide)
      setSession((current) => current ?? restored);
      setStatus((current) => (current !== "loading" ? current : restored ? "authenticated" : "anonymous"));
      if (restored) await refreshAccessToken(); // silencieux : obtient un nouveau jeton d'accès
      else await flushPendingLogout(); // révoque un jeton laissé par une déconnexion hors ligne
    }

    void restore();
    return () => {
      isCancelled = true;
    };
  }, []);

  // 2) Le serveur refuse le renouvellement : on le signale sans vider la caisse.
  useEffect(() => onSessionExpired(() => setSessionExpired(true)), []);

  const startSession = useCallback((opened: AuthSession) => {
    setSession(opened);
    setStatus("authenticated");
    setSessionExpired(false);
    return opened;
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => startSession(await loginMerchant(credentials)),
    [startSession],
  );

  const register = useCallback(
    async (input: RegisterInput) => startSession(await registerMerchant(input)),
    [startSession],
  );

  const logout = useCallback(async () => {
    await logoutMerchant();
    setSession(null);
    setStatus("anonymous");
    setSessionExpired(false);
  }, []);

  const value = useMemo(
    () => ({ status, session, sessionExpired, login, register, logout }),
    [status, session, sessionExpired, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === null) throw new Error("useAuth doit être utilisé à l'intérieur de <AuthProvider>.");
  return context;
}
