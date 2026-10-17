/**
 * Toutes les erreurs réseau deviennent une ApiError, quel que soit leur type :
 * le reste de l'application n'a qu'une seule forme d'erreur à gérer.
 * Le format du serveur est décrit dans backend/core/api.py :
 *   { "error": { "code": "...", "message": "...", "details": ... } }
 */

import axios, { type AxiosResponse } from "axios";

export type ApiErrorKind =
  | "network" // aucune réponse : hors ligne, serveur injoignable, CORS
  | "timeout" // le serveur a mis trop de temps
  | "http" // le serveur a répondu avec une erreur (400, 401, 429...)
  | "unknown"; // erreur de programmation, pas du réseau

type ErrorBody = { error?: { code?: string; message?: string; details?: unknown } };

type ApiErrorOptions = {
  status?: number | null;
  code?: string | null;
  details?: unknown;
  retryAfterSeconds?: number | null;
  message?: string;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | null;
  readonly code: string | null;
  readonly details: unknown;
  readonly retryAfterSeconds: number | null;

  constructor(kind: ApiErrorKind, options: ApiErrorOptions = {}) {
    super(options.message ?? options.code ?? kind);
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status ?? null;
    this.code = options.code ?? null;
    this.details = options.details ?? null;
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

function toPositiveSeconds(value: unknown): number | null {
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
}

/** Attente demandée par le serveur : en-tête Retry-After, sinon détail du corps JSON. */
function readRetryAfter(response: AxiosResponse<ErrorBody>): number | null {
  const fromHeader = toPositiveSeconds(response.headers?.["retry-after"]);
  if (fromHeader !== null) return fromHeader;
  const details = response.data?.error?.details;
  const fromBody = details && typeof details === "object" ? (details as Record<string, unknown>) : {};
  return toPositiveSeconds(fromBody.retry_after);
}

function fromResponse(response: AxiosResponse<ErrorBody>): ApiError {
  const body = response.data?.error;
  return new ApiError("http", {
    status: response.status,
    code: body?.code ?? null,
    details: body?.details ?? null,
    retryAfterSeconds: readRetryAfter(response),
    message: body?.message,
  });
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError(error)) return new ApiError("unknown");
  if (error.response) return fromResponse(error.response as AxiosResponse<ErrorBody>);
  const isTimeout = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
  return new ApiError(isTimeout ? "timeout" : "network");
}

/**
 * Erreurs de champs d'un 400 : { "phone": ["Ce numéro est déjà utilisé."] } devient
 * { phone: "Ce numéro est déjà utilisé." } (on garde le premier message de chaque champ).
 */
export function getFieldErrors(error: ApiError): Record<string, string> {
  if (typeof error.details !== "object" || error.details === null) return {};
  const fieldErrors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(error.details)) {
    if (Array.isArray(messages) && typeof messages[0] === "string") fieldErrors[field] = messages[0];
  }
  return fieldErrors;
}
