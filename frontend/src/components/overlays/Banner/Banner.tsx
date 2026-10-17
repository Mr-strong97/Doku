import type { AriaRole, ReactNode } from "react";

import { cx } from "@/lib/classNames";

import styles from "./Banner.module.css";

/**
 * Bandeau d'information ou d'alerte (Interfaces §5.5 : Banner).
 *  - `info`    : panneau bleuté qui explique quelque chose (P02 : mode hors ligne automatique)
 *  - `warning` : attire l'attention sans bloquer (ex. « vous êtes hors ligne »)
 *
 * Animation (règle 11) : entrée en fondu avec une légère descente (≈ 220 ms), pour que
 * l'apparition d'un bandeau ne fasse pas « sauter » la page.
 */

type Tone = "info" | "warning";

const TONE_CLASSES: Record<Tone, { box: string; icon: string }> = {
  info: { box: "bg-surface-field text-ink", icon: "text-brand-700" },
  warning: { box: "bg-warning-surface text-warning-900", icon: "text-warning-900" },
};

type BannerProps = { tone?: Tone; icon?: ReactNode; role?: AriaRole; children: ReactNode };

export function Banner({ tone = "info", icon, role, children }: BannerProps) {
  const classes = TONE_CLASSES[tone];
  return (
    <div role={role} className={cx(styles.banner, classes.box, "flex w-full items-start gap-2.5 rounded-field px-3.5 py-2.5 text-[13px] leading-5")}>
      {icon && (
        <span aria-hidden="true" className={cx(classes.icon, "mt-0.5 shrink-0")}>
          {icon}
        </span>
      )}
      <div>{children}</div>
    </div>
  );
}
