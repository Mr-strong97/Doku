import { describe, expect, it } from "vitest";

import { DEFAULT_RETRY_SECONDS } from "@/config/constants";
import { classifyAuthError } from "@/lib/authErrors";
import { makeApiError, makeNetworkError, makeTimeoutError } from "@/test-utils/apiErrors";

describe("classifyAuthError", () => {
  it("réseau ou délai dépassé : hors ligne", () => {
    expect(classifyAuthError(makeNetworkError())).toEqual({ type: "offline" });
    expect(classifyAuthError(makeTimeoutError())).toEqual({ type: "offline" });
  });

  it("429 : attente du serveur, ou 60 s par défaut", () => {
    const withHeader = makeApiError(429, "THROTTLED", null, { "retry-after": "17" });
    expect(classifyAuthError(withHeader)).toEqual({ type: "throttled", retryAfterSeconds: 17 });
    expect(classifyAuthError(makeApiError(429, "THROTTLED"))).toEqual({
      type: "throttled",
      retryAfterSeconds: DEFAULT_RETRY_SECONDS,
    });
  });

  it("401 INVALID_CREDENTIALS : identifiants invalides", () => {
    expect(classifyAuthError(makeApiError(401, "INVALID_CREDENTIALS"))).toEqual({ type: "invalid-credentials" });
  });

  it("400 avec des champs : erreurs de validation", () => {
    const failure = classifyAuthError(makeApiError(400, "VALIDATION_ERROR", { phone: ["Déjà utilisé."] }));
    expect(failure).toEqual({ type: "validation", fieldErrors: { phone: "Déjà utilisé." } });
  });

  it("tout le reste : inconnu (500, 403, bug...)", () => {
    expect(classifyAuthError(makeApiError(500, "SERVER_ERROR"))).toEqual({ type: "unknown" });
    expect(classifyAuthError(makeApiError(400, "PARSE_ERROR"))).toEqual({ type: "unknown" });
    expect(classifyAuthError(new Error("bug"))).toEqual({ type: "unknown" });
  });
});
