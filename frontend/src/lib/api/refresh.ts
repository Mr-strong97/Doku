/**
 * Renouvellement du jeton d'accès avec le cookie refresh (dossier §6.5).
 *
 * « Single-flight » : si plusieurs requêtes demandent un renouvellement en même temps, un seul
 * appel part et tout le monde partage son résultat. C'est indispensable : le serveur révoque
 * le refresh après usage, donc un second appel simultané serait pris pour un vol de jeton.
 */

import axios from "axios";

import { API_BASE_URL, API_TIMEOUT_MS, CLIENT_HEADER_NAME, CLIENT_HEADER_VALUE } from "@/config/constants";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { toApiError } from "@/lib/api/errors";
import { emitSessionExpired } from "@/lib/api/sessionEvents";
import { clearAccessToken, setAccessToken } from "@/lib/api/tokenStore";

export type RefreshResult =
  | { status: "refreshed"; access: string }
  | { status: "expired" } // le serveur refuse : il faudra se reconnecter
  | { status: "unreachable" }; // hors ligne ou serveur en panne : la session n'est PAS perdue

const HTTP_UNAUTHORIZED = 401;

let inflightRefresh: Promise<RefreshResult> | null = null;

async function requestNewAccessToken(): Promise<RefreshResult> {
  try {
    // Client Axios « nu » (sans intercepteurs) : sinon un 401 ici relancerait un renouvellement
    const { data } = await axios.post<{ access: string }>(`${API_BASE_URL}${ENDPOINTS.refresh}`, null, {
      withCredentials: true, // envoie le cookie refresh
      timeout: API_TIMEOUT_MS,
      headers: { [CLIENT_HEADER_NAME]: CLIENT_HEADER_VALUE },
    });
    setAccessToken(data.access);
    return { status: "refreshed", access: data.access };
  } catch (error) {
    if (toApiError(error).status !== HTTP_UNAUTHORIZED) return { status: "unreachable" };
    clearAccessToken();
    emitSessionExpired();
    return { status: "expired" };
  }
}

export function refreshAccessToken(): Promise<RefreshResult> {
  inflightRefresh ??= requestNewAccessToken().finally(() => {
    inflightRefresh = null;
  });
  return inflightRefresh;
}
