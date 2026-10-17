import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cx } from "@/lib/classNames";

import styles from "./FieldFrame.module.css";

/**
 * Cadre commun des champs de formulaire (DRY : TextField et PhoneField le partagent) :
 * libellé, mention à droite, zone de saisie, puis aide ou erreur.
 *
 * Animations (règle 11) :
 *  - focus : la bordure passe au vert et un halo apparaît (« c'est ici que vous écrivez ») ;
 *  - erreur : le champ « secoue » une fois (feedback immédiat sans bloquer) et le message
 *    descend en fondu. L'erreur n'est jamais signalée par la couleur seule : icône + texte.
 */

export type FieldAppearance = "filled" | "elevated";

/** « filled » : fond bleuté, pour un champ posé sur une carte blanche (P02).
 *  « elevated » : fond blanc et ombre douce, pour un champ posé sur le fond de page (P01). */
const APPEARANCE_CLASSES: Record<FieldAppearance, string> = {
  filled: "bg-surface-field",
  elevated: "bg-surface-card shadow-field",
};

/** Taille du texte saisi : 18 px sur P01, 16 px sur P02 (mesuré sur les maquettes ; jamais sous 16 px,
 *  seuil à partir duquel iOS cesse de zoomer sur le champ). */
export const INPUT_TEXT_CLASSES: Record<FieldAppearance, string> = { filled: "text-base", elevated: "text-lg" };

/** Les maquettes P01 (libellés gris) et P02 (libellés foncés) diffèrent : on les reproduit fidèlement. */
const LABEL_CLASSES: Record<FieldAppearance, string> = { filled: "text-ink", elevated: "text-ink-soft" };

/** Identifiant du message d'aide ou d'erreur, relié au champ par aria-describedby. */
export function getMessageId(fieldId: string): string {
  return `${fieldId}-message`;
}

type FieldFrameProps = {
  fieldId: string;
  label: string;
  labelAside?: ReactNode;
  error?: string;
  hint?: ReactNode;
  appearance: FieldAppearance;
  children: ReactNode;
};

export function FieldFrame({ fieldId, label, labelAside, error, hint, appearance, children }: FieldFrameProps) {
  const controlClassName = cx(
    styles.control,
    APPEARANCE_CLASSES[appearance],
    "flex min-h-13 items-stretch overflow-hidden rounded-field",
  );

  return (
    <div className="flex w-full flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={fieldId} className={cx("text-[13px] leading-4 font-semibold", LABEL_CLASSES[appearance])}>
          {label}
        </label>
        {labelAside}
      </div>

      <div className={controlClassName} data-invalid={error ? "true" : undefined}>
        {children}
      </div>

      {error ? (
        <p
          id={getMessageId(fieldId)}
          role="alert"
          className={cx(styles.message, "flex items-start gap-1.5 text-[13px] font-medium text-danger-700")}
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : (
        hint && (
          <p id={getMessageId(fieldId)} className="flex items-start gap-1.5 text-[11px] text-ink-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
