import { describe, expect, it } from "vitest";

import { evaluatePasswordStrength } from "@/lib/password";

describe("evaluatePasswordStrength", () => {
  it("niveau 0 tant que rien n'est saisi", () => {
    expect(evaluatePasswordStrength("")).toEqual({ level: 0, tooShort: false });
  });

  it("signale « trop court » sous 8 caractères", () => {
    expect(evaluatePasswordStrength("Ab1!")).toEqual({ level: 1, tooShort: true });
  });

  it("reste faible quand le mot de passe est répétitif", () => {
    expect(evaluatePasswordStrength("aaaaaaaa")).toEqual({ level: 1, tooShort: false });
  });

  it.each([
    ["abcdefgh", 1], // une seule famille de caractères
    ["Sucre2026", 2], // minuscules + majuscule + chiffres
    ["Rose2026!", 3], // quatre familles
    ["Sucre-et-Cafe-2026", 4], // quatre familles + long
  ])("« %s » vaut le niveau %i", (password, level) => {
    expect(evaluatePasswordStrength(password).level).toBe(level);
  });

  it("monte avec la longueur", () => {
    const short = evaluatePasswordStrength("abcdefgh").level;
    const long = evaluatePasswordStrength("abcdefghijklmnopqrstu").level;
    expect(long).toBeGreaterThan(short);
  });
});
