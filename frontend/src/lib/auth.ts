/**
 * AuthService côté client (dossier §7.3) : inscription, connexion, déconnexion.
 *
 * Les écrans n'appellent jamais le réseau eux-mêmes (sauf l'authentification, qui passe ici).
 * Chaque fonction fait trois choses : appeler l'API, garder le jeton en MÉMOIRE, écrire la
 * session en base locale pour pouvoir rouvrir la caisse hors ligne.
 */

import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { toApiError } from "@/lib/api/errors";
import { clearAccessToken, setAccessToken } from "@/lib/api/tokenStore";
import {
  clearLocalSession,
  clearPendingLogout,
  hasPendingLogout,
  loadLocalSession,
  markPendingLogout,
  saveLocalSession,
} from "@/lib/db/session";
import type { AuthResponse, AuthSession, LoginCredentials, RegisterInput } from "@/types/auth";

function toAuthSession({ user, shop, onboarding_completed }: AuthResponse): AuthSession {
  return { user, shop, onboarding_completed };
}

/** Garde le jeton en mémoire et écrit la session locale. */
async function openSession(response: AuthResponse): Promise<AuthSession> {
  setAccessToken(response.access);
  const session = toAuthSession(response);
  try {
    await saveLocalSession(session);
  } catch (error) {
    // Stockage local indisponible (navigation privée...) : l'utilisateur peut travailler,
    // mais la caisse ne pourra pas se rouvrir sans Internet.
    console.warn("Session locale non enregistrée", error);
  }
  return session;
}

export async function registerMerchant(input: RegisterInput): Promise<AuthSession> {
  const { data } = await apiClient.post<AuthResponse>(ENDPOINTS.register, input);
  return openSession(data);
}

export async function loginMerchant(credentials: LoginCredentials): Promise<AuthSession> {
  const { data } = await apiClient.post<AuthResponse>(ENDPOINTS.login, credentials);
  return openSession(data);
}

/**
 * Se déconnecte TOUJOURS localement, même sans réseau (dossier §6.5). Si le serveur n'a pas pu
 * révoquer le jeton, on le note : la révocation sera retentée au prochain démarrage.
 */
export async function logoutMerchant(): Promise<void> {
  try {
    await apiClient.post(ENDPOINTS.logout);
  } catch (error) {
    if (toApiError(error).kind !== "http") await markPendingLogout().catch(() => undefined);
  }
  clearAccessToken();
  await clearLocalSession().catch(() => undefined);
}

/** Retente la révocation d'un jeton laissée en attente par une déconnexion hors ligne. */
export async function flushPendingLogout(): Promise<void> {
  if (!(await hasPendingLogout())) return;
  try {
    await apiClient.post(ENDPOINTS.logout);
  } catch (error) {
    if (toApiError(error).kind !== "http") return; // toujours hors ligne : on réessaiera
  }
  await clearPendingLogout();
}

/** Lit la session gardée sur l'appareil. Fonctionne sans Internet. */
export function restoreSession(): Promise<AuthSession | null> {
  return loadLocalSession();
}
