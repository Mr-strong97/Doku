import type { ReactNode } from "react";

import { cx } from "@/lib/classNames";

import styles from "./PageEnter.module.css";

/**
 * Enveloppe d'un écran : joue une courte animation d'entrée à chaque affichage de la page.
 * Objectif UX : adoucir le passage d'un écran à l'autre (connexion ↔ inscription).
 * Animation : fondu + montée de 10 px en 260 ms (désactivée si « réduire les animations »).
 */
export function PageEnter({ children }: { children: ReactNode }) {
  return <div className={cx(styles.enter, "flex w-full flex-col items-center")}>{children}</div>;
}
