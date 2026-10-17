"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Button } from "@/components/forms/Button/Button";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import { messages } from "@/messages/fr";

/**
 * ÉCRAN TEMPORAIRE : remplace P03 et P04 le temps qu'ils soient construits. Il permet de voir
 * la redirection après connexion, et de tester la déconnexion. À supprimer avec les vrais écrans.
 */
export function PlaceholderScreen({ code, title }: { code: string; title: string }) {
  const router = useRouter();
  const { status, session, logout } = useAuth();

  // Garde minimale (le vrai AppShell fera ce contrôle pour tous les écrans connectés)
  useEffect(() => {
    if (status === "anonymous") router.replace(ROUTES.login);
  }, [status, router]);

  async function handleLogout() {
    await logout();
    router.replace(ROUTES.login);
  }

  if (status !== "authenticated" || !session) return null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-104 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-extrabold text-brand-900">
        {code} · {title}
      </h1>
      <p className="text-ink-soft">{messages.placeholderScreen.comingSoon}</p>
      <p className="text-sm text-ink-muted">
        {messages.placeholderScreen.signedInAs} <strong>{session.user.full_name}</strong> ({session.shop.name})
      </p>
      <Button onClick={handleLogout}>{messages.placeholderScreen.logout}</Button>
    </main>
  );
}
