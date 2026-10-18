import { AlertCircle, Inbox, RefreshCw, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import styles from "./StatePanel.module.css";

type StatePanelProps = { kind: "empty" | "error"; title: string; detail: string; action?: ReactNode };
const icons: Record<StatePanelProps["kind"], LucideIcon> = { empty: Inbox, error: AlertCircle };

/** États vides et erreurs à message clair, identiques sur toutes les listes. */
export function StatePanel({ kind, title, detail, action }: StatePanelProps) {
  const Icon = icons[kind];
  return <section className={`${styles.panel} ${kind === "error" ? styles.error : ""}`} aria-live="polite"><Icon aria-hidden="true" size={25}/><div><h2>{title}</h2><p>{detail}</p>{action && <div className={styles.action}>{action}</div>}</div></section>;
}

export function InlineRefresh({ updating, onRefresh }: { updating?: boolean; onRefresh?: () => void }) {
  if (!onRefresh) return null;
  return <button type="button" className={styles.refresh} onClick={onRefresh} disabled={updating}><RefreshCw aria-hidden="true" size={16} className={updating ? styles.spin : ""}/>{updating ? "Mise à jour…" : "Actualiser"}</button>;
}
