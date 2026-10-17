import { describe, expect, it } from "vitest";

import { messages } from "@/messages/fr";
import {
  hasErrors,
  pickFieldErrors,
  validateLogin,
  validateRegister,
  type RegisterValues,
} from "@/lib/validation";

const VALID_REGISTER: RegisterValues = {
  full_name: "Rose Mbuyi",
  phone: "810000001",
  shop_name: "Boutique Maman Rose",
  password: "Sucre-et-Cafe-2026",
};

describe("validateLogin", () => {
  it("accepte un téléphone complet et un mot de passe", () => {
    expect(validateLogin({ phone: "810000001", password: "x" })).toEqual({});
  });

  it("refuse un téléphone incomplet et un mot de passe vide", () => {
    const errors = validateLogin({ phone: "8100", password: "" });
    expect(errors.phone).toBe(messages.validation.phoneIncomplete);
    expect(errors.password).toBe(messages.login.passwordRequired);
  });

  it("ne rappelle pas la politique de mot de passe à la connexion", () => {
    expect(validateLogin({ phone: "810000001", password: "court" }).password).toBeUndefined();
  });
});

describe("validateRegister", () => {
  it("accepte un formulaire complet", () => {
    expect(validateRegister(VALID_REGISTER)).toEqual({});
  });

  it("signale chaque champ invalide", () => {
    const errors = validateRegister({ full_name: " ", phone: "81", shop_name: "A", password: "court" });
    expect(Object.keys(errors).sort()).toEqual(["full_name", "password", "phone", "shop_name"]);
  });

  it("refuse un mot de passe de moins de 8 caractères mais accepte 8", () => {
    expect(validateRegister({ ...VALID_REGISTER, password: "1234567" }).password).toBeDefined();
    expect(validateRegister({ ...VALID_REGISTER, password: "12345678" }).password).toBeUndefined();
  });

  it("refuse un mot de passe de plus de 128 caractères", () => {
    expect(validateRegister({ ...VALID_REGISTER, password: "x".repeat(129) }).password).toBeDefined();
  });
});

describe("hasErrors et pickFieldErrors", () => {
  it("hasErrors détecte l'absence et la présence d'erreurs", () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ phone: "x" })).toBe(true);
  });

  it("pickFieldErrors ne garde que les champs du formulaire", () => {
    const picked = pickFieldErrors<RegisterValues>(
      { phone: "déjà utilisé", non_field_errors: "autre", inconnu: "x" },
      ["full_name", "phone"],
    );
    expect(picked).toEqual({ phone: "déjà utilisé" });
  });
});
