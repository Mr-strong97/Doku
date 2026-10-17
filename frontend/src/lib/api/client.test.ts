import axios from "axios";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "@/lib/api/client";
import { ENDPOINTS } from "@/lib/api/endpoints";
import { onSessionExpired } from "@/lib/api/sessionEvents";
import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/api/tokenStore";
import { makeApiError, makeNetworkError } from "@/test-utils/apiErrors";

type Seen = { url?: string; authorization?: string };

/** Faux serveur : répond 401 au jeton « old » et 200 au jeton « new ». */
function installFakeServer(seen: Seen[]) {
  apiClient.defaults.adapter = async (config) => {
    const authorization = config.headers.get("Authorization") as string | undefined;
    seen.push({ url: config.url, authorization });
    if (authorization === "Bearer old") throw makeApiError(401, "UNAUTHENTICATED", null, {}, config);
    return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
  };
}

describe("apiClient", () => {
  let seen: Seen[];

  beforeEach(() => {
    seen = [];
    installFakeServer(seen);
  });

  afterEach(() => {
    clearAccessToken();
    vi.restoreAllMocks();
  });

  it("ajoute le jeton d'accès aux requêtes normales mais jamais aux routes d'authentification", async () => {
    setAccessToken("abc");

    await apiClient.get("/products/");
    await apiClient.post(ENDPOINTS.login, {});

    expect(seen[0].authorization).toBe("Bearer abc");
    expect(seen[1].authorization).toBeUndefined();
  });

  it("renouvelle le jeton après un 401 puis rejoue la requête", async () => {
    setAccessToken("old");
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({ data: { access: "new" } });

    const response = await apiClient.get("/products/");

    expect(response.data).toEqual({ ok: true });
    expect(refresh).toHaveBeenCalledTimes(1);
    const [url, , options] = refresh.mock.calls[0];
    expect(url).toMatch(/\/auth\/refresh\/$/);
    expect(options).toMatchObject({ withCredentials: true, headers: { "X-Doku-Client": "web" } });
    expect(seen.map((s) => s.authorization)).toEqual(["Bearer old", "Bearer new"]);
    expect(getAccessToken()).toBe("new");
  });

  it("ne lance qu'UN renouvellement quand plusieurs requêtes échouent en même temps", async () => {
    setAccessToken("old");
    const refresh = vi.spyOn(axios, "post").mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { data: { access: "new" } };
    });

    const responses = await Promise.all([apiClient.get("/a/"), apiClient.get("/b/"), apiClient.get("/c/")]);

    expect(responses).toHaveLength(3);
    expect(refresh).toHaveBeenCalledTimes(1); // sinon le serveur croirait à un vol de jeton
  });

  it("signale la session expirée quand le serveur refuse le renouvellement", async () => {
    setAccessToken("old");
    vi.spyOn(axios, "post").mockRejectedValue(makeApiError(401, "SESSION_EXPIRED"));
    const onExpired = vi.fn();
    const unsubscribe = onSessionExpired(onExpired);

    await expect(apiClient.get("/products/")).rejects.toMatchObject({ response: { status: 401 } });

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(getAccessToken()).toBeNull();
    unsubscribe();
  });

  it("ne déclare PAS la session expirée quand le renouvellement échoue faute de réseau", async () => {
    setAccessToken("old");
    vi.spyOn(axios, "post").mockRejectedValue(makeNetworkError());
    const onExpired = vi.fn();
    const unsubscribe = onSessionExpired(onExpired);

    await expect(apiClient.get("/products/")).rejects.toBeDefined();

    expect(onExpired).not.toHaveBeenCalled(); // hors ligne n'est pas expiré
    unsubscribe();
  });

  it("ne rejoue jamais une requête deux fois (pas de boucle)", async () => {
    setAccessToken("old");
    // Le renouvellement « réussit » mais rend un jeton que le serveur refuse encore
    const refresh = vi.spyOn(axios, "post").mockResolvedValue({ data: { access: "old" } });

    await expect(apiClient.get("/products/")).rejects.toMatchObject({ response: { status: 401 } });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(seen).toHaveLength(2);
  });

  it("ne tente pas de renouvellement après un 401 sur une route d'authentification", async () => {
    apiClient.defaults.adapter = async (config) => {
      throw makeApiError(401, "INVALID_CREDENTIALS", null, {}, config);
    };
    const refresh = vi.spyOn(axios, "post");

    await expect(apiClient.post(ENDPOINTS.login, {})).rejects.toMatchObject({ response: { status: 401 } });

    expect(refresh).not.toHaveBeenCalled();
  });
});
