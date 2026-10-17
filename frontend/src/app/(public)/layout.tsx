import type { ReactNode } from "react";

import { PublicShell } from "@/components/structure/PublicShell/PublicShell";
import { RedirectIfAuthenticated } from "@/components/structure/RedirectIfAuthenticated/RedirectIfAuthenticated";

/**
 * Gabarit L1 « Public » : commun à P01 (connexion) et P02 (inscription).
 * Si une session existe déjà, on n'a rien à faire ici : on repart vers la caisse.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <PublicShell>
      <RedirectIfAuthenticated />
      {children}
    </PublicShell>
  );
}
