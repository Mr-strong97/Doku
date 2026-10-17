/**
 * Types de l'authentification. Les noms de champs sont en snake_case, identiques au JSON
 * de l'API et à la base (dossier §18.3) : aucune conversion à écrire ni à maintenir.
 */

export type UserProfile = {
  id: string;
  phone: string;
  full_name: string;
  email: string | null;
};

export type ShopProfile = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  reference_currency_code: string;
};

/** Réponse de POST /auth/login/ et /auth/register/. */
export type AuthResponse = {
  access: string;
  user: UserProfile;
  shop: ShopProfile;
  onboarding_completed: boolean;
};

/** Ce que le téléphone garde en local : tout sauf le jeton d'accès (qui reste en mémoire). */
export type AuthSession = Omit<AuthResponse, "access">;

export type LoginCredentials = { phone: string; password: string };

export type RegisterInput = {
  full_name: string;
  phone: string;
  password: string;
  shop_name: string;
};
