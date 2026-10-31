import { describe, expect, it } from "vitest";

import { productSaveError } from "@/lib/productErrors";
import { makeApiError, makeNetworkError } from "@/test-utils/apiErrors";

describe("productSaveError", () => {
  it("affiche le détail de validation du champ concerné", () => {
    expect(productSaveError(makeApiError(400, "VALIDATION_ERROR", { image: ["Utilisez une image JPG, PNG ou WebP."] })))
      .toBe("Photo : Utilisez une image JPG, PNG ou WebP.");
  });

  it("explique une erreur de stockage uniquement lorsqu'une image était envoyée", () => {
    expect(productSaveError(makeApiError(500, "SERVER_ERROR"), true))
      .toContain("photo n’a pas pu être enregistrée");
  });

  it("distingue une coupure réseau", () => {
    expect(productSaveError(makeNetworkError())).toContain("connexion");
  });
});
