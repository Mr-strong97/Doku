/**
 * Saisie du numéro de téléphone : on ne garde que les chiffres NATIONAUX (9 chiffres pour
 * la RDC). Le préfixe +243 est affiché à part, à côté du champ, et ajouté à l'envoi.
 *
 * Ces fonctions sont « pures » (même entrée, même sortie, aucun effet) : faciles à tester.
 */

import { COUNTRY } from "@/config/constants";

const NON_DIGITS = /\D/g;
const LEADING_ZEROS = /^0+/;
const DIAL_CODE_DIGITS = COUNTRY.dialCode.replace("+", ""); // « 243 »
const GROUP_SIZES = [2, 3, 4]; // « 81 000 0001 »

/** Un numéro national valide : 9 chiffres, le premier n'étant jamais 0. */
const COMPLETE_NATIONAL_NUMBER = new RegExp(`^[1-9][0-9]{${COUNTRY.nationalNumberLength - 1}}$`);

/**
 * Extrait les chiffres nationaux de ce que la personne a tapé ou collé.
 *  - « 081 000 0001 »      → « 810000001 » (le 0 d'appel national se retire)
 *  - « +243 81 000 0001 »  → « 810000001 » (préfixe international collé)
 *  - « 00243810000001 »    → « 810000001 »
 */
export function extractNationalDigits(input: string): string {
  let digits = input.replace(NON_DIGITS, "");
  const hasInternationalMarker = input.trim().startsWith("+") || digits.startsWith("00");
  if (hasInternationalMarker) {
    digits = digits.replace(/^00/, "");
    if (digits.startsWith(DIAL_CODE_DIGITS)) digits = digits.slice(DIAL_CODE_DIGITS.length);
  }
  return digits.replace(LEADING_ZEROS, "").slice(0, COUNTRY.nationalNumberLength);
}

/** Affiche les chiffres par groupes lisibles : « 810000001 » → « 81 000 0001 ». */
export function formatNationalDigits(digits: string): string {
  const groups: string[] = [];
  let offset = 0;
  for (const size of GROUP_SIZES) {
    if (offset >= digits.length) break;
    groups.push(digits.slice(offset, offset + size));
    offset += size;
  }
  return groups.join(" ");
}

/** Numéro au format international envoyé à l'API : « +243810000001 ». */
export function toInternationalNumber(nationalDigits: string): string {
  return `${COUNTRY.dialCode}${nationalDigits}`;
}

export function isCompleteNationalNumber(nationalDigits: string): boolean {
  return COMPLETE_NATIONAL_NUMBER.test(nationalDigits);
}

/**
 * Position du curseur dans le texte formaté, juste après le n-ième chiffre.
 * Sert à ne pas faire sauter le curseur quand les espaces sont réinsérés pendant la frappe.
 */
export function caretIndexForDigitCount(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seenDigits = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index])) seenDigits += 1;
    if (seenDigits === digitCount) return index + 1;
  }
  return formatted.length;
}
