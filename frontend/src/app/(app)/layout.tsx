import type { ReactNode } from "react";

import { RequireSession } from "@/components/structure/RequireSession/RequireSession";

/** Toutes les routes métier demandent une session locale restaurée, y compris hors connexion. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <RequireSession>{children}</RequireSession>;
}
