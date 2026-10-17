/** Routes d'authentification de l'API (dossier §19.3), relatives à API_BASE_URL. */
export const ENDPOINTS = {
  register: "/auth/register/",
  login: "/auth/login/",
  refresh: "/auth/refresh/",
  logout: "/auth/logout/",
} as const;

const AUTH_PATHS: string[] = Object.values(ENDPOINTS);

/** Ces routes n'utilisent pas le jeton d'accès, et ne se rejouent jamais après un 401. */
export function isAuthEndpoint(url: string | undefined): boolean {
  return url !== undefined && AUTH_PATHS.some((path) => url.endsWith(path));
}
