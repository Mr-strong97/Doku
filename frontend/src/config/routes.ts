/** Adresses des écrans (Interfaces §3 : une adresse stable par page). */
export const ROUTES = {
  root: "/",
  login: "/login", // P01
  register: "/register", // P02
  onboarding: "/onboarding", // P03
  pos: "/pos", // P04
  checkout: "/pos/checkout", // P05
} as const;

/**
 * Où aller une fois la session ouverte (P01) : la caisse, ou la configuration initiale
 * tant que le taux de change n'est pas enregistré (P03).
 */
export function getPostAuthRoute(onboardingCompleted: boolean): string {
  return onboardingCompleted ? ROUTES.pos : ROUTES.onboarding;
}
