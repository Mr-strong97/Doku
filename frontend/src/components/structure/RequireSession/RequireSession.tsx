"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { ROUTES } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";

import styles from "./RequireSession.module.css";

/** Empêche brièvement l'affichage des écrans métier tant que la session locale n'est pas restaurée. */
export function RequireSession({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();
  useEffect(() => { if (status === "anonymous") router.replace(ROUTES.login); }, [router, status]);
  if (status !== "authenticated") return <main className={styles.loading} aria-live="polite"><span aria-hidden="true">D</span><p>Ouverture sécurisée de votre caisse…</p></main>;
  return <>{children}</>;
}
