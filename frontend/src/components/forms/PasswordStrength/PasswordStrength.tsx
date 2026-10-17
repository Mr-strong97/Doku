import { cx } from "@/lib/classNames";
import { evaluatePasswordStrength } from "@/lib/password";
import { messages } from "@/messages/fr";

import styles from "./PasswordStrength.module.css";

/**
 * Indicateur de robustesse : 4 barres + un mot (« Faible », « Fort »...). Le niveau n'est
 * jamais donné par la couleur seule : le mot est toujours affiché et annoncé aux lecteurs
 * d'écran (aria-live).
 *
 * Animations (règle 11) : les barres se remplissent en douceur (transition de couleur),
 * ce qui rend l'effet de chaque caractère tapé visible sans distraire.
 */

const BAR_STEPS = [1, 2, 3, 4] as const;

export function PasswordStrength({ password }: { password: string }) {
  const { level, tooShort } = evaluatePasswordStrength(password);
  const label = tooShort ? messages.passwordStrength.tooShort : messages.passwordStrength.levels[level];

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {BAR_STEPS.map((step) => (
          <span key={step} className={cx(styles.bar, "h-1 rounded-full")} data-filled={step <= level} data-level={level} />
        ))}
      </div>
      <div className="flex items-baseline justify-between text-xs" aria-live="polite" aria-atomic="true">
        <span className="text-ink-soft">{messages.passwordStrength.caption}</span>
        <strong className={cx(styles.label, "font-bold")} data-level={level}>
          {label}
        </strong>
      </div>
    </div>
  );
}
