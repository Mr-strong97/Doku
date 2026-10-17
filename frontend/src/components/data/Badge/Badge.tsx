import type { ReactNode } from "react";

import { cx } from "@/lib/classNames";

import styles from "./Badge.module.css";

/**
 * Étiquette arrondie avec un point de couleur (Interfaces §5.5 : Badge).
 *  - `success` : un état, par exemple « Prêt pour le mode hors-ligne »
 *  - `info`    : une simple mention, par exemple le slogan
 *
 * Animation (règle 11) : sur le ton « success », le point émet une onde lente (≈ 2,4 s) pour
 * signifier « actif, prêt ». Purement décorative, et coupée si l'utilisateur réduit les animations.
 */

type Tone = "success" | "info";

const TONE_CLASSES: Record<Tone, { badge: string; dot: string }> = {
  success: { badge: "bg-surface-field text-success-900", dot: "bg-success-700" },
  info: { badge: "bg-surface-chip text-ink-secondary", dot: "bg-brand-700" },
};

type Size = "sm" | "md";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1 text-[11px]", // P01
  md: "px-3 py-[3px] text-[13px]", // P02
};

type BadgeProps = { tone?: Tone; size?: Size; children: ReactNode };

export function Badge({ tone = "success", size = "sm", children }: BadgeProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <span className={cx(styles.badge, classes.badge, SIZE_CLASSES[size], "inline-flex items-center gap-2 rounded-full font-semibold")}>
      <span aria-hidden="true" className={cx(tone === "success" && styles.pulse, classes.dot, "size-2 rounded-full")} />
      {children}
    </span>
  );
}
