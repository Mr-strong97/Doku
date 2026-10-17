import { beforeEach, describe, expect, it, vi } from "vitest";

import { flushPendingLogout, loginMerchant, logoutMerchant, registerMerchant, restoreSession } from "@/lib/auth";
import { apiClient } from "@/lib/api/client";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/api/tokenStore";
import { getDatabase } from "@/lib/db/database";
import * as sessionModule from "@/lib/db/session";
import { makeApiError, makeNetworkError } from "@/test-utils/apiErrors";
import type { AuthResponse } from "@/types/auth";

vi.mock("@/lib/api/client", () => ({ apiClient: { post: vi.fn() } }));

const post = vi.mocked(apiClient.post);

const RESPONSE: AuthResponse = {
  access: "jeton-d-acces",
  user: { id: "u1", phone: "+243810000001", full_name: "Rose Mbuyi", email: null },
  shop: { id: "s1", name: "Boutique Maman Rose", address: null, phone: null, reference_currency_code: "CDF" },
  onboarding_completed: false,
};

describe("AuthService côté client", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    post.mockReset();
    clearAccessToken();
    const db = getDatabase();
    await Promise.all([db.profile.clear(), db.shop.clear(), db.meta.clear()]);
  });

  it("loginMerchant : garde le jeton en mémoire et la session en base locale, sans le jeton", async () => {
    post.mockResolvedValue({ data: RESPONSE });

    const session = await loginMerchant({ phone: "+243810000001", password: "secret-1234" });

    expect(post).toHaveBeenCalledWith("/auth/login/", { phone: "+243810000001", password: "secret-1234" });
    expect(getAccessToken()).toBe("jeton-d-acces");
    expect(session).not.toHaveProperty("access");
    expect(await restoreSession()).toEqual(session);
  });

  it("registerMerchant : envoie les quatre champs et ouvre la session", async () => {
    post.mockResolvedValue({ data: RESPONSE });
    const input = { full_name: "Rose Mbuyi", phone: "+243810000001", password: "Sucre-et-Cafe-2026", shop_name: "Boutique" };

    await registerMerchant(input);

    expect(post).toHaveBeenCalledWith("/auth/register/", input);
    expect(getAccessToken()).toBe("jeton-d-acces");
  });

  it("laisse passer l'erreur du serveur (mauvais identifiants) sans rien enregistrer", async () => {
    post.mockRejectedValue(makeApiError(401, "INVALID_CREDENTIALS"));

    await expect(loginMerchant({ phone: "+243810000001", password: "x" })).rejects.toBeDefined();

    expect(getAccessToken()).toBeNull();
    expect(await restoreSession()).toBeNull();
  });

  it("continue de fonctionner quand le stockage local est indisponible", async () => {
    post.mockResolvedValue({ data: RESPONSE });
    vi.spyOn(sessionModule, "saveLocalSession").mockRejectedValueOnce(new Error("stockage indisponible"));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const session = await loginMerchant({ phone: "+243810000001", password: "secret-1234" });

    expect(session.user.id).toBe("u1");
    expect(getAccessToken()).toBe("jeton-d-acces");
  });

  describe("logoutMerchant", () => {
    beforeEach(async () => {
      post.mockResolvedValueOnce({ data: RESPONSE });
      await loginMerchant({ phone: "+243810000001", password: "secret-1234" });
      post.mockReset();
    });

    it("révoque le jeton côté serveur puis efface tout localement", async () => {
      post.mockResolvedValue({ data: null });

      await logoutMerchant();

      expect(post).toHaveBeenCalledWith("/auth/logout/");
      expect(getAccessToken()).toBeNull();
      expect(await restoreSession()).toBeNull();
      expect(await sessionModule.hasPendingLogout()).toBe(false);
    });

    it("se déconnecte quand même hors ligne, et note de révoquer le jeton plus tard", async () => {
      post.mockRejectedValue(makeNetworkError());

      await logoutMerchant();

      expect(getAccessToken()).toBeNull();
      expect(await restoreSession()).toBeNull();
      expect(await sessionModule.hasPendingLogout()).toBe(true);
    });

    it("ne note rien quand le serveur a répondu (même par une erreur)", async () => {
      post.mockRejectedValue(makeApiError(403, "FORBIDDEN"));

      await logoutMerchant();

      expect(await restoreSession()).toBeNull();
      expect(await sessionModule.hasPendingLogout()).toBe(false);
    });
  });

  describe("flushPendingLogout", () => {
    it("ne fait rien s'il n'y a rien en attente", async () => {
      await flushPendingLogout();
      expect(post).not.toHaveBeenCalled();
    });

    it("révoque le jeton laissé en attente, puis retire la marque", async () => {
      await sessionModule.markPendingLogout();
      post.mockResolvedValue({ data: null });

      await flushPendingLogout();

      expect(post).toHaveBeenCalledWith("/auth/logout/");
      expect(await sessionModule.hasPendingLogout()).toBe(false);
    });

    it("garde la marque tant que le réseau est injoignable", async () => {
      await sessionModule.markPendingLogout();
      post.mockRejectedValue(makeNetworkError());

      await flushPendingLogout();

      expect(await sessionModule.hasPendingLogout()).toBe(true);
    });

    it("retire la marque quand le serveur répond par une erreur (inutile de réessayer)", async () => {
      await sessionModule.markPendingLogout();
      post.mockRejectedValue(makeApiError(403, "FORBIDDEN"));

      await flushPendingLogout();

      expect(await sessionModule.hasPendingLogout()).toBe(false);
    });
  });

  it("setAccessToken / getAccessToken : le jeton ne vit qu'en mémoire", () => {
    setAccessToken("x");
    expect(getAccessToken()).toBe("x");
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });
});
