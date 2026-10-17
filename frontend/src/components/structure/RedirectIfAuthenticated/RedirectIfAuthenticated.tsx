"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { getPostAuthRoute } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Posé dans le gabarit public : dès qu'une session existe (déjà connecté en arrivant, ou
 * connexion réussie à l'instant), on quitte les écrans de connexion pour la caisse (P04)
 * ou, si la configuration initiale n'est pas terminée, pour P03.
 * `replace` (et non `push`) : le bouton « retour » ne ramène pas au formulaire.
 */
export function RedirectIfAuthenticated() {
  const router = useRouter();
  const { status, session } = useAuth();

  useEffect(() => {
    if (status === "authenticated" && session) {
      router.replace(getPostAuthRoute(session.onboarding_completed));
    }
  }, [status, session, router]);

  return null;
}
