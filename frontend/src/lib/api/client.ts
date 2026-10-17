/**
 * Client HTTP unique de l'application (Axios). Les écrans ne l'utilisent jamais directement :
 * ils passent par les services (lib/auth.ts, puis lib/services/*), dossier Interfaces §5.6.
 *
 * Deux intercepteurs :
 *   1. avant l'envoi : ajoute le jeton d'accès (« Authorization: Bearer ... ») ;
 *   2. après une réponse 401 : renouvelle le jeton UNE fois, puis rejoue la requête.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { API_BASE_URL, API_TIMEOUT_MS, CLIENT_HEADER_NAME, CLIENT_HEADER_VALUE } from "@/config/constants";
import { isAuthEndpoint } from "@/lib/api/endpoints";
import { refreshAccessToken } from "@/lib/api/refresh";
import { getAccessToken } from "@/lib/api/tokenStore";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
  withCredentials: true, // nécessaire pour que le navigateur envoie le cookie refresh
  headers: { [CLIENT_HEADER_NAME]: CLIENT_HEADER_VALUE },
});

/**
 * Marque une requête déjà rejouée. Axios recrée l'objet de configuration à chaque appel : un
 * simple « WeakSet » d'objets perdrait la trace de la requête et rejouerait à l'infini si le
 * serveur refuse encore le nouveau jeton (boucle détectée par les tests). Une propriété
 * personnalisée, elle, est conservée d'un appel à l'autre.
 */
declare module "axios" {
  interface AxiosRequestConfig {
    isRetry?: boolean;
  }
}

function attachAccessToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = getAccessToken();
  if (token && !isAuthEndpoint(config.url)) config.headers.set("Authorization", `Bearer ${token}`);
  return config;
}

async function retryOnceAfterRefresh(error: AxiosError): Promise<unknown> {
  const request = error.config;
  const isRetryable = error.response?.status === 401 && request && !request.isRetry && !isAuthEndpoint(request.url);
  if (!isRetryable) throw error;

  const result = await refreshAccessToken();
  if (result.status !== "refreshed") throw error;
  return apiClient({ ...request, isRetry: true }); // l'intercepteur d'envoi y remet le nouveau jeton
}

apiClient.interceptors.request.use(attachAccessToken);
apiClient.interceptors.response.use((response) => response, retryOnceAfterRefresh);
