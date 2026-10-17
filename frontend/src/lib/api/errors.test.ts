import { describe, expect, it } from "vitest";

import { ApiError, getFieldErrors, toApiError } from "@/lib/api/errors";
import { makeApiError, makeHttpError, makeNetworkError, makeTimeoutError } from "@/test-utils/apiErrors";

describe("toApiError", () => {
  it("reconnaît une absence de réponse comme une erreur réseau", () => {
    const error = toApiError(makeNetworkError());
    expect(error.kind).toBe("network");
    expect(error.status).toBeNull();
  });

  it("reconnaît un délai dépassé", () => {
    expect(toApiError(makeTimeoutError()).kind).toBe("timeout");
  });

  it("lit le format d'erreur de l'API", () => {
    const error = toApiError(makeApiError(401, "INVALID_CREDENTIALS"));
    expect(error).toMatchObject({ kind: "http", status: 401, code: "INVALID_CREDENTIALS" });
  });

  it("lit l'attente demandée dans l'en-tête Retry-After", () => {
    const error = toApiError(makeApiError(429, "THROTTLED", { retry_after: 10 }, { "retry-after": "42" }));
    expect(error.retryAfterSeconds).toBe(42);
  });

  it("à défaut d'en-tête, lit l'attente dans le corps de la réponse", () => {
    const error = toApiError(makeApiError(429, "THROTTLED", { retry_after: 30 }));
    expect(error.retryAfterSeconds).toBe(30);
  });

  it("supporte une réponse qui n'est pas au format de l'API (page d'erreur d'un proxy)", () => {
    const error = toApiError(makeHttpError(502, "<html>Bad gateway</html>"));
    expect(error).toMatchObject({ kind: "http", status: 502, code: null });
  });

  it("garde une ApiError telle quelle et classe le reste en « unknown »", () => {
    const original = new ApiError("network");
    expect(toApiError(original)).toBe(original);
    expect(toApiError(new TypeError("bug")).kind).toBe("unknown");
  });
});

describe("getFieldErrors", () => {
  it("garde le premier message de chaque champ", () => {
    const error = toApiError(
      makeApiError(400, "VALIDATION_ERROR", { phone: ["Déjà utilisé.", "autre"], password: ["Trop court."] }),
    );
    expect(getFieldErrors(error)).toEqual({ phone: "Déjà utilisé.", password: "Trop court." });
  });

  it("ignore ce qui n'est pas une liste de messages", () => {
    const error = toApiError(makeApiError(429, "THROTTLED", { retry_after: 30 }));
    expect(getFieldErrors(error)).toEqual({});
    expect(getFieldErrors(new ApiError("network"))).toEqual({});
  });
});
