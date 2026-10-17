/** Fabriques d'erreurs Axios pour les tests : on simule le serveur sans jamais ouvrir de connexion. */

import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

/** `config` : la requête qui a échoué. Axios la joint toujours à ses erreurs réelles, et les
 *  intercepteurs en ont besoin pour rejouer la requête. */
export function makeHttpError(
  status: number,
  body: unknown = {},
  headers: Record<string, string> = {},
  config?: InternalAxiosRequestConfig,
): AxiosError {
  const response = { status, statusText: "", data: body, headers, config: config ?? {} } as AxiosResponse;
  return new AxiosError("Request failed", "ERR_BAD_REQUEST", config, undefined, response);
}

/** Erreur du format de l'API : { error: { code, message, details } }. */
export function makeApiError(
  status: number,
  code: string,
  details: unknown = null,
  headers: Record<string, string> = {},
  config?: InternalAxiosRequestConfig,
) {
  return makeHttpError(status, { error: { code, message: code, details } }, headers, config);
}

/** Aucune réponse : hors ligne, serveur injoignable ou bloqué par CORS. */
export function makeNetworkError(): AxiosError {
  return new AxiosError("Network Error", "ERR_NETWORK");
}

export function makeTimeoutError(): AxiosError {
  return new AxiosError("timeout", "ECONNABORTED");
}
