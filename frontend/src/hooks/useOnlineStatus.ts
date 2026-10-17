import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Vrai si le navigateur se croit connecté. « Hors ligne » est fiable ; « en ligne » ne
 * l'est pas toujours (Wi-Fi sans Internet). Le test réel de /health/ viendra avec la
 * synchronisation (dossier §14.4) et remplacera ce hook de base.
 */
export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true, // rendu côté serveur : on suppose connecté
  );
}
