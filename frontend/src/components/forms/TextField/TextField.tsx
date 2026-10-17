"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId, useState, type InputHTMLAttributes, type ReactNode, type Ref } from "react";

import {
  FieldFrame,
  INPUT_TEXT_CLASSES,
  getMessageId,
  type FieldAppearance,
} from "@/components/forms/FieldFrame/FieldFrame";
import { cx } from "@/lib/classNames";
import { messages } from "@/messages/fr";

import styles from "./TextField.module.css";

/**
 * Champ texte avec libellé, mention, icône, aide et erreur (Interfaces §5.5).
 * Un champ `type="password"` peut recevoir un bouton « Afficher / Masquer ».
 *
 * Animations (règle 11) : le changement d'icône œil / œil barré se fait en fondu ; le bouton
 * « Afficher » s'assombrit au survol et se tasse à l'appui (micro-interaction).
 */

type RevealStyle = "label" | "icon-label";

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "className"> & {
  label: string;
  /** Petite mention à droite du libellé (« Obligatoire »...). */
  labelAside?: ReactNode;
  icon?: ReactNode;
  error?: string;
  hint?: ReactNode;
  appearance?: FieldAppearance;
  /** Ajoute « Afficher / Masquer » (champs mot de passe) : texte seul, ou icône + texte. */
  revealToggle?: RevealStyle;
  ref?: Ref<HTMLInputElement>;
};

type RevealToggleProps = { isRevealed: boolean; onToggle: () => void; withIcon: boolean };

function RevealToggle({ isRevealed, onToggle, withIcon }: RevealToggleProps) {
  const Icon = isRevealed ? EyeOff : Eye;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isRevealed ? messages.common.hidePassword : messages.common.showPassword}
      className={cx(
        styles.reveal,
        "flex shrink-0 items-center text-brand-700",
        // icône + texte (P02) : compact pour laisser la place au texte du champ ; texte seul (P01)
        withIcon ? "gap-1.5 px-3 text-[13px] font-bold" : "px-4 text-sm font-semibold",
      )}
    >
      {withIcon && <Icon key={String(isRevealed)} aria-hidden="true" className={cx(styles.revealIcon, "size-4")} />}
      <span>{isRevealed ? messages.common.hide : messages.common.show}</span>
    </button>
  );
}

export function TextField({
  label,
  labelAside,
  icon,
  error,
  hint,
  appearance = "filled",
  revealToggle,
  type = "text",
  ref,
  ...inputProps
}: TextFieldProps) {
  const fieldId = useId();
  const [isRevealed, setIsRevealed] = useState(false);
  const isPassword = type === "password";
  const hasToggle = isPassword && revealToggle !== undefined;
  const describedBy = error || hint ? getMessageId(fieldId) : undefined;

  return (
    <FieldFrame fieldId={fieldId} label={label} labelAside={labelAside} error={error} hint={hint} appearance={appearance}>
      {icon && (
        <span aria-hidden="true" className="flex items-center pl-4 text-ink-muted">
          {icon}
        </span>
      )}
      <input
        {...inputProps}
        ref={ref}
        id={fieldId}
        type={isPassword && isRevealed ? "text" : type}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cx(
          styles.input,
          "min-w-0 flex-1 bg-transparent py-2.5 text-ink",
          INPUT_TEXT_CLASSES[appearance],
          icon ? "pl-3" : "pl-4",
          hasToggle ? "pr-1" : "pr-4",
        )}
      />
      {hasToggle && (
        <RevealToggle
          isRevealed={isRevealed}
          onToggle={() => setIsRevealed((current) => !current)}
          withIcon={revealToggle === "icon-label"}
        />
      )}
    </FieldFrame>
  );
}
