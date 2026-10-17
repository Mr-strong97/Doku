"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { BrandHeader } from "@/components/structure/BrandHeader/BrandHeader";
import { ROUTES, getPostAuthRoute } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";

import styles from "./RootRedirect.module.css";

/**
 * Écran de démarrage (adresse « / », début d'une PWA installée) : pendant que la session
 * locale est lue (quelques millisecondes), on montre le logo ; puis on aiguille vers la
 * caisse / la configuration (connecté) ou vers la connexion (anonyme).
 *
 * Animation (règle 11) : le logo « respire » doucement pendant le chargement (état de chargement).
 */
export function RootRedirect() {
  const router = useRouter();
  const { status, session } = useAuth();

  useEffect(() => {
    if (status === "anonymous") router.replace(ROUTES.login);
    if (status === "authenticated" && session) router.replace(getPostAuthRoute(session.onboarding_completed));
  }, [status, session, router]);

  return (
    <main className="grid min-h-dvh place-items-center">
      <div className={styles.breathing}>
        <BrandHeader />
      </div>
    </main>
  );
}
