import type { ReactNode } from "react";

import { cx } from "@/lib/classNames";

import styles from "./PublicShell.module.css";

/**
 * Gabarit L1 « Public » (Interfaces §4) : écrans sans session (connexion, inscription).
 * Pas de barre du haut ni d'onglets, contenu centré, formulaire sur une seule colonne.
 * Les zones de sécurité (encoche, barre de gestes) sont respectées (voir le fichier CSS).
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <main className={cx(styles.shell, "flex min-h-dvh flex-col")}>
      <div className={cx(styles.column, "mx-auto flex w-full max-w-104 flex-col items-center")}>{children}</div>
    </main>
  );
}
