"use client";

import {
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  type ChangeEvent,
  type ReactNode,
  type Ref,
} from "react";

import { FlagCD } from "@/components/data/Flag/FlagCD";
import {
  FieldFrame,
  INPUT_TEXT_CLASSES,
  getMessageId,
  type FieldAppearance,
} from "@/components/forms/FieldFrame/FieldFrame";
import { COUNTRY } from "@/config/constants";
import { cx } from "@/lib/classNames";
import { caretIndexForDigitCount, extractNationalDigits, formatNationalDigits } from "@/lib/phone";

import styles from "./PhoneField.module.css";

/**
 * Champ téléphone au format international (Interfaces §5.5) : le préfixe du pays est affiché
 * à gauche (+243), la personne ne saisit que les 9 chiffres nationaux, regroupés pendant la
 * frappe (« 81 000 0001 »). Le parent reçoit les chiffres bruts (« 810000001 »).
 *
 * Animations (règle 11) : même cadre que TextField (halo au focus, secousse sur erreur).
 */

type PhoneFieldProps = {
  label: string;
  labelAside?: ReactNode;
  hint?: ReactNode;
  error?: string;
  /** Chiffres nationaux sans espaces, par exemple « 810000001 ». */
  value: string;
  onValueChange: (nationalDigits: string) => void;
  placeholder?: string;
  appearance?: FieldAppearance;
  name?: string;
  /** « tel-national » remplit depuis le profil du téléphone ; « username » aide les gestionnaires de mots de passe. */
  autoComplete?: "tel-national" | "username";
  ref?: Ref<HTMLInputElement>;
};

export function PhoneField({
  label,
  labelAside,
  hint,
  error,
  value,
  onValueChange,
  placeholder,
  appearance = "filled",
  name,
  autoComplete = "tel-national",
  ref,
}: PhoneFieldProps) {
  const fieldId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  // Permet au formulaire de placer le curseur dans ce champ (premier champ en erreur)
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

  // Les espaces sont réinsérés à chaque frappe : on remet le curseur là où la personne tapait,
  // sinon il sauterait à la fin du champ.
  useLayoutEffect(() => {
    const position = pendingCaret.current;
    if (position === null || !inputRef.current) return;
    pendingCaret.current = null;
    inputRef.current.setSelectionRange(position, position);
  });

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { value: typed, selectionStart } = event.target;
    const digits = extractNationalDigits(typed);
    const digitsBeforeCaret = extractNationalDigits(typed.slice(0, selectionStart ?? typed.length)).length;
    pendingCaret.current = caretIndexForDigitCount(
      formatNationalDigits(digits),
      Math.min(digitsBeforeCaret, digits.length),
    );
    onValueChange(digits);
  }

  return (
    <FieldFrame fieldId={fieldId} label={label} labelAside={labelAside} error={error} hint={hint} appearance={appearance}>
      <span
        className={cx(styles.prefix, "flex shrink-0 items-center gap-2 pr-3 pl-4 text-base font-bold text-ink")}
        data-appearance={appearance}
      >
        <FlagCD />
        {COUNTRY.dialCode}
      </span>
      <input
        ref={inputRef}
        id={fieldId}
        name={name}
        type="tel"
        inputMode="numeric"
        autoComplete={autoComplete}
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        placeholder={placeholder}
        value={formatNationalDigits(value)}
        onChange={handleChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? getMessageId(fieldId) : undefined}
        className={cx(
          styles.input,
          "min-w-0 flex-1 bg-transparent py-2.5 pr-4 pl-3 text-ink",
          INPUT_TEXT_CLASSES[appearance],
        )}
      />
    </FieldFrame>
  );
}
