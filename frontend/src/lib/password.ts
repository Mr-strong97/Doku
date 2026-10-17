/**
 * Indicateur de robustesse du mot de passe (maquette P02 : 4 barres).
 *
 * ATTENTION : c'est un conseil d'affichage, pas une protection. Le serveur reste la seule
 * autorité (dossier §17.4) : il refuse les mots de passe trop courts, trop courants ou trop
 * proches du nom ou du téléphone, quoi que dise cet indicateur.
 */

import {
  PASSWORD_LONG_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_MIN_UNIQUE_CHARACTERS,
  PASSWORD_VERY_LONG_LENGTH,
} from "@/config/constants";

/** 0 = rien saisi, 1 = faible, 2 = moyen, 3 = bon, 4 = fort. */
export type PasswordStrengthLevel = 0 | 1 | 2 | 3 | 4;

export type PasswordStrength = {
  level: PasswordStrengthLevel;
  /** Vrai tant que le mot de passe n'atteint pas la longueur minimale. */
  tooShort: boolean;
};

const CHARACTER_CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/];
const MAX_LEVEL = 4;

function countCharacterClasses(password: string): number {
  return CHARACTER_CLASSES.filter((pattern) => pattern.test(password)).length;
}

function countLengthBonuses(password: string): number {
  const longBonus = password.length >= PASSWORD_LONG_LENGTH ? 1 : 0;
  const veryLongBonus = password.length >= PASSWORD_VERY_LONG_LENGTH ? 1 : 0;
  return longBonus + veryLongBonus;
}

function clampLevel(value: number): PasswordStrengthLevel {
  return Math.min(Math.max(value, 1), MAX_LEVEL) as PasswordStrengthLevel;
}

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (password.length === 0) return { level: 0, tooShort: false };
  if (password.length < PASSWORD_MIN_LENGTH) return { level: 1, tooShort: true };

  const isRepetitive = new Set(password).size < PASSWORD_MIN_UNIQUE_CHARACTERS;
  if (isRepetitive) return { level: 1, tooShort: false };

  const points = countCharacterClasses(password) + countLengthBonuses(password);
  return { level: clampLevel(points - 1), tooShort: false };
}
