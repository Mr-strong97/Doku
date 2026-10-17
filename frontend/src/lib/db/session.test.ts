import { beforeEach, describe, expect, it } from "vitest";

import { getDatabase } from "@/lib/db/database";
import {
  clearLocalSession,
  clearPendingLogout,
  hasPendingLogout,
  loadLocalSession,
  markPendingLogout,
  saveLocalSession,
} from "@/lib/db/session";
import type { AuthSession } from "@/types/auth";

function makeSession(suffix = "1", onboardingCompleted = false): AuthSession {
  return {
    user: { id: `user-${suffix}`, phone: `+24381000000${suffix}`, full_name: `Commerçant ${suffix}`, email: null },
    shop: {
      id: `shop-${suffix}`,
      name: `Boutique ${suffix}`,
      address: null,
      phone: null,
      reference_currency_code: "CDF",
    },
    onboarding_completed: onboardingCompleted,
  };
}

describe("session locale (IndexedDB)", () => {
  beforeEach(async () => {
    const db = getDatabase();
    await Promise.all([db.profile.clear(), db.shop.clear(), db.meta.clear()]);
  });

  it("retourne null quand aucune session n'est enregistrée", async () => {
    expect(await loadLocalSession()).toBeNull();
  });

  it("relit exactement ce qui a été enregistré", async () => {
    const session = makeSession("1", true);
    await saveLocalSession(session);
    expect(await loadLocalSession()).toEqual(session);
  });

  it("n'garde qu'un seul compte par appareil : une nouvelle connexion remplace l'ancienne", async () => {
    await saveLocalSession(makeSession("1"));
    await saveLocalSession(makeSession("2"));

    expect((await loadLocalSession())?.user.id).toBe("user-2");
    expect(await getDatabase().profile.count()).toBe(1);
    expect(await getDatabase().shop.count()).toBe(1);
  });

  it("efface la session à la déconnexion", async () => {
    await saveLocalSession(makeSession());
    await clearLocalSession();
    expect(await loadLocalSession()).toBeNull();
    expect(await getDatabase().profile.count()).toBe(0);
  });

  it("ne stocke jamais de jeton ni de mot de passe", async () => {
    await saveLocalSession(makeSession());
    const db = getDatabase();
    const everything = JSON.stringify([await db.profile.toArray(), await db.shop.toArray(), await db.meta.toArray()]);
    expect(everything).not.toMatch(/access|refresh|token|password|eyJ/i);
  });

  it("mémorise une déconnexion faite hors ligne, et la déconnexion locale ne l'efface pas", async () => {
    await markPendingLogout();
    await saveLocalSession(makeSession());
    await markPendingLogout();
    await clearLocalSession();

    expect(await hasPendingLogout()).toBe(true);
    await clearPendingLogout();
    expect(await hasPendingLogout()).toBe(false);
  });

  it("annule la déconnexion en attente quand une nouvelle connexion remplace le cookie", async () => {
    await markPendingLogout();
    await saveLocalSession(makeSession());
    expect(await hasPendingLogout()).toBe(false);
  });
});
