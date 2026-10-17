/**
 * Transforme une erreur brute en « cas d'échec » compréhensible par les formulaires.
 * Fonction pure : les deux formulaires (P01 et P02) partagent la même analyse (DRY), chacun
 * choisit ensuite le message à afficher.
 */

import { DEFAULT_RETRY_SECONDS } from "@/config/constants";
import { getFieldErrors, toApiError } from "@/lib/api/errors";

export type AuthFailure =
  | { type: "offline" }
  | { type: "throttled"; retryAfterSeconds: number }
  | { type: "invalid-credentials" }
  | { type: "validation"; fieldErrors: Record<string, string> }
  | { type: "unknown" };

const HTTP_BAD_REQUEST = 400;
const HTTP_UNAUTHORIZED = 401;
const HTTP_TOO_MANY_REQUESTS = 429;

export function classifyAuthError(error: unknown): AuthFailure {
  const apiError = toApiError(error);

  if (apiError.kind === "network" || apiError.kind === "timeout") return { type: "offline" };

  if (apiError.status === HTTP_TOO_MANY_REQUESTS) {
    return { type: "throttled", retryAfterSeconds: apiError.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS };
  }
  if (apiError.status === HTTP_UNAUTHORIZED && apiError.code === "INVALID_CREDENTIALS") {
    return { type: "invalid-credentials" };
  }
  const fieldErrors = apiError.status === HTTP_BAD_REQUEST ? getFieldErrors(apiError) : {};
  if (Object.keys(fieldErrors).length > 0) return { type: "validation", fieldErrors };

  return { type: "unknown" };
}
