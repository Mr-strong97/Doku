import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cx } from "@/lib/classNames";

import styles from "./Button.module.css";

/**
 * Bouton de Doku.
 *  - `primary` : gros bouton plein (action principale d'un écran)
 *  - `text`    : texte coloré cliquable (« Afficher », « Oublié ? », liens)
 * `Button` rend un <button> ; `ButtonLink` rend un lien de navigation avec le même aspect.
 *
 * Animations (règle 11) :
 *  - survol : le bouton monte d'un pixel, l'ombre s'étend (retour visuel, « je suis cliquable ») ;
 *  - appui : il se tasse légèrement (retour tactile immédiat) ;
 *  - chargement : une roue tourne à la place de l'icône et le bouton se verrouille.
 */

type Variant = "primary" | "text";

type SharedProps = {
  variant?: Variant;
  /** Icône avant le texte. */
  icon?: ReactNode;
  /** Icône après le texte (ex : une flèche). */
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
};

type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof SharedProps> & { loading?: boolean };

type ButtonLinkProps = SharedProps & { href: string };

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "min-h-12.5 justify-center gap-2 rounded-field bg-brand-700 px-6 text-base font-semibold text-white shadow-button hover:bg-brand-800",
  text: "relative gap-1 rounded-sm font-semibold text-brand-700", // la taille du texte est choisie à l'usage
};

type ClassNameOptions = { variant: Variant; fullWidth?: boolean; loading?: boolean; className?: string };

function buildClassName({ variant, fullWidth, loading, className }: ClassNameOptions): string {
  return cx(
    styles.button,
    variant === "primary" ? styles.primary : styles.text,
    "inline-flex items-center",
    VARIANT_CLASSES[variant],
    fullWidth && "w-full",
    loading && styles.loading,
    className,
  );
}

type ContentProps = Pick<SharedProps, "icon" | "trailingIcon" | "children"> & { loading?: boolean };

function ButtonContent({ icon, trailingIcon, loading, children }: ContentProps) {
  return (
    <>
      {loading ? <LoaderCircle aria-hidden="true" className={cx(styles.spinner, "size-5")} /> : icon}
      <span>{children}</span>
      {!loading && trailingIcon}
    </>
  );
}

export function Button({
  variant = "primary",
  icon,
  trailingIcon,
  fullWidth,
  loading = false,
  className,
  children,
  disabled,
  type = "button", // jamais « submit » par accident
  ...nativeProps
}: ButtonProps) {
  return (
    <button
      {...nativeProps}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buildClassName({ variant, fullWidth, loading, className })}
    >
      <ButtonContent icon={icon} trailingIcon={trailingIcon} loading={loading}>
        {children}
      </ButtonContent>
    </button>
  );
}

export function ButtonLink({
  variant = "text",
  icon,
  trailingIcon,
  fullWidth,
  className,
  children,
  href,
}: ButtonLinkProps) {
  return (
    <Link href={href} className={buildClassName({ variant, fullWidth, className })}>
      <ButtonContent icon={icon} trailingIcon={trailingIcon}>
        {children}
      </ButtonContent>
    </Link>
  );
}
