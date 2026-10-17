/**
 * Validation côté client : un CONFORT (retour immédiat, avant d'appeler le réseau).
 * Le serveur revalide tout : cette couche n'est jamais une protection (dossier §17.4).
 */

import { NAME_MIN_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "@/config/constants";
import { messages } from "@/messages/fr";
import { isCompleteNationalNumber } from "@/lib/phone";

/** Les clés des formulaires reprennent les noms de champs de l'API (snake_case). */
export type LoginValues = { phone: string; password: string };
export type RegisterValues = { full_name: string; phone: string; shop_name: string; password: string };

export type FieldErrors<Values> = Partial<Record<keyof Values, string>>;

function isNameValid(name: string): boolean {
  return name.trim().length >= NAME_MIN_LENGTH;
}

export function validateLogin(values: LoginValues): FieldErrors<LoginValues> {
  const errors: FieldErrors<LoginValues> = {};
  if (!isCompleteNationalNumber(values.phone)) errors.phone = messages.validation.phoneIncomplete;
  // À la connexion on ne rappelle pas la politique de mot de passe : seulement « obligatoire ».
  if (values.password.length === 0) errors.password = messages.login.passwordRequired;
  return errors;
}

export function validateRegister(values: RegisterValues): FieldErrors<RegisterValues> {
  const errors: FieldErrors<RegisterValues> = {};
  if (!isNameValid(values.full_name)) errors.full_name = messages.validation.fullNameRequired;
  if (!isCompleteNationalNumber(values.phone)) errors.phone = messages.validation.phoneIncomplete;
  if (!isNameValid(values.shop_name)) errors.shop_name = messages.validation.shopNameRequired;
  const passwordLength = values.password.length;
  if (passwordLength < PASSWORD_MIN_LENGTH || passwordLength > PASSWORD_MAX_LENGTH) {
    errors.password = messages.validation.passwordTooShort;
  }
  return errors;
}

export function hasErrors<Values>(errors: FieldErrors<Values>): boolean {
  return Object.keys(errors).length > 0;
}

/** Garde, parmi les erreurs renvoyées par le serveur, celles qui concernent un champ du formulaire. */
export function pickFieldErrors<Values>(
  serverErrors: Record<string, string>,
  knownFields: ReadonlyArray<keyof Values>,
): FieldErrors<Values> {
  const picked: FieldErrors<Values> = {};
  for (const field of knownFields) {
    const message = serverErrors[String(field)];
    if (message) picked[field] = message;
  }
  return picked;
}
