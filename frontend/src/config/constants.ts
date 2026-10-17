/**
 * Constantes de l'application.
 *
 * Règle des scouts : aucune valeur « magique » dans le code. Chaque nombre ou texte
 * technique porte un nom ici, avec une phrase qui explique d'où il vient.
 */

// --- API ------------------------------------------------------------------------------
/** Adresse de l'API Django. Se règle avec NEXT_PUBLIC_API_URL (voir .env.example). */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export const API_TIMEOUT_MS = 15_000;

/** En-tête exigé par le serveur sur les routes qui lisent le cookie (protection CSRF). */
export const CLIENT_HEADER_NAME = "X-Doku-Client";
export const CLIENT_HEADER_VALUE = "web";

/** Attente proposée quand le serveur refuse (429) sans dire combien de temps patienter. */
export const DEFAULT_RETRY_SECONDS = 60;

// --- Formulaires ----------------------------------------------------------------------
/** Doit rester identique à PASSWORD_MIN_LENGTH dans backend/config/settings.py. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 150;

/** Au-delà de ce nombre de caractères, le mot de passe gagne un cran de robustesse. */
export const PASSWORD_LONG_LENGTH = 12;
export const PASSWORD_VERY_LONG_LENGTH = 16;
/** Un mot de passe avec si peu de caractères différents (« aaaaaaaa ») reste faible. */
export const PASSWORD_MIN_UNIQUE_CHARACTERS = 4;

// --- Pays (MVP : RDC uniquement, dossier H-01) ------------------------------------------
export const COUNTRY = {
  code: "CD",
  label: "RDC",
  dialCode: "+243",
  nationalNumberLength: 9, // un numéro congolais compte 9 chiffres après +243
} as const;

// --- Notifications (Interfaces §5.3) --------------------------------------------------
export const TOAST_DURATION_MS = 3_000;
export const TOAST_ERROR_DURATION_MS = 6_000;
