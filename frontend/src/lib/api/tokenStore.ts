/**
 * Jeton d'accès (15 minutes) : conservé UNIQUEMENT en mémoire.
 *
 * Jamais dans localStorage ni IndexedDB : tout script injecté (XSS) pourrait le lire. En cas
 * de rechargement de la page il disparaît, et l'application en demande un nouveau grâce au
 * cookie refresh (HttpOnly, que JavaScript ne peut pas lire).
 */

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}
