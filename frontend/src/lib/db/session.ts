/**
 * Session locale : ce qui permet d'ouvrir la caisse sans Internet (dossier §14.8).
 * On y garde le profil et la boutique. JAMAIS de jeton ni de mot de passe.
 */

import { getDatabase } from "@/lib/db/database";
import type { AuthSession } from "@/types/auth";

const SESSION_KEY = "session";
const PENDING_LOGOUT_KEY = "pending_logout";

type StoredSession = { user_id: string; shop_id: string; onboarding_completed: boolean };

export async function saveLocalSession(session: AuthSession): Promise<void> {
  const db = getDatabase();
  const stored: StoredSession = {
    user_id: session.user.id,
    shop_id: session.shop.id,
    onboarding_completed: session.onboarding_completed,
  };
  // Une seule transaction : tout est écrit, ou rien. Un seul compte à la fois sur l'appareil.
  await db.transaction("rw", db.profile, db.shop, db.meta, async () => {
    await Promise.all([db.profile.clear(), db.shop.clear()]);
    await db.profile.put(session.user);
    await db.shop.put(session.shop);
    await db.meta.put({ key: SESSION_KEY, value: stored });
    await db.meta.delete(PENDING_LOGOUT_KEY); // la nouvelle connexion remplace le cookie
  });
}

export async function loadLocalSession(): Promise<AuthSession | null> {
  const db = getDatabase();
  const entry = await db.meta.get(SESSION_KEY);
  if (!entry) return null;
  const stored = entry.value as StoredSession;
  const [user, shop] = await Promise.all([db.profile.get(stored.user_id), db.shop.get(stored.shop_id)]);
  if (!user || !shop) return null;
  return { user, shop, onboarding_completed: stored.onboarding_completed };
}

export async function clearLocalSession(): Promise<void> {
  const db = getDatabase();
  await db.transaction("rw", db.profile, db.shop, db.meta, async () => {
    await Promise.all([db.profile.clear(), db.shop.clear(), db.meta.delete(SESSION_KEY)]);
  });
  // Les données métier (produits, ventes...) ne seront purgées que si tout est synchronisé :
  // ce sera le rôle de la modale M04 (dossier §17.9), pas d'ici.
}

/** Déconnexion faite hors ligne : le serveur n'a pas pu révoquer le jeton, on le fera plus tard. */
export async function markPendingLogout(): Promise<void> {
  await getDatabase().meta.put({ key: PENDING_LOGOUT_KEY, value: true });
}

export async function hasPendingLogout(): Promise<boolean> {
  return (await getDatabase().meta.get(PENDING_LOGOUT_KEY)) !== undefined;
}

export async function clearPendingLogout(): Promise<void> {
  await getDatabase().meta.delete(PENDING_LOGOUT_KEY);
}
