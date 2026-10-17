"use client";

import type { ReactNode } from "react";

import { ToastHost } from "@/components/overlays/ToastHost/ToastHost";
import { AuthProvider } from "@/contexts/AuthContext";

/**
 * Fournisseurs globaux (Interfaces §5.6) : session, notifications. La base locale et le
 * moteur de synchronisation viendront s'ajouter ici.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      {children}
      <ToastHost />
    </AuthProvider>
  );
}
