/**
 * Petit système d'abonnement : prévient l'application quand le serveur refuse de renouveler
 * la session (refresh expiré, révoqué ou volé). L'écran « Reconnexion requise » (M02) s'y
 * branchera : la caisse reste utilisable, seule la synchronisation est suspendue.
 */

type Listener = () => void;

const listeners = new Set<Listener>();

/** S'abonne. Retourne la fonction qui se désabonne (à renvoyer depuis un useEffect). */
export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitSessionExpired(): void {
  listeners.forEach((listener) => listener());
}
