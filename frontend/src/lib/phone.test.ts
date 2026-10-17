import { describe, expect, it } from "vitest";

import {
  caretIndexForDigitCount,
  extractNationalDigits,
  formatNationalDigits,
  isCompleteNationalNumber,
  toInternationalNumber,
} from "@/lib/phone";

describe("extractNationalDigits", () => {
  it.each([
    ["810000001", "810000001"],
    ["81 000 0001", "810000001"],
    ["081 000 0001", "810000001"], // le 0 d'appel national se retire
    ["0810000001", "810000001"],
    ["+243 81 000 0001", "810000001"], // numéro international collé
    ["00243810000001", "810000001"],
    ["+243810000001", "810000001"],
    ["81abc000-0001", "810000001"], // tout sauf les chiffres est ignoré
    ["8100000019999", "810000001"], // plafonné à 9 chiffres
    ["", ""],
    ["000", ""],
  ])("« %s » devient « %s »", (typed, expected) => {
    expect(extractNationalDigits(typed)).toBe(expected);
  });

  it("garde un numéro qui commence par 243 quand on le tape (ce n'est pas un préfixe)", () => {
    expect(extractNationalDigits("243123456")).toBe("243123456");
  });
});

describe("formatNationalDigits", () => {
  it.each([
    ["", ""],
    ["8", "8"],
    ["81", "81"],
    ["810", "81 0"],
    ["81000", "81 000"],
    ["810000", "81 000 0"],
    ["810000001", "81 000 0001"],
  ])("« %s » s'affiche « %s »", (digits, expected) => {
    expect(formatNationalDigits(digits)).toBe(expected);
  });
});

describe("isCompleteNationalNumber", () => {
  it("n'accepte que 9 chiffres, sans 0 initial", () => {
    expect(isCompleteNationalNumber("810000001")).toBe(true);
    expect(isCompleteNationalNumber("81000000")).toBe(false);
    expect(isCompleteNationalNumber("0810000001")).toBe(false);
    expect(isCompleteNationalNumber("081000001")).toBe(false);
    expect(isCompleteNationalNumber("")).toBe(false);
  });
});

describe("toInternationalNumber", () => {
  it("ajoute le préfixe du pays", () => {
    expect(toInternationalNumber("810000001")).toBe("+243810000001");
  });
});

describe("caretIndexForDigitCount", () => {
  it("place le curseur juste après le n-ième chiffre, espaces compris", () => {
    expect(caretIndexForDigitCount("81 000 0001", 0)).toBe(0);
    expect(caretIndexForDigitCount("81 000 0001", 2)).toBe(2);
    expect(caretIndexForDigitCount("81 000 0001", 3)).toBe(4); // saute l'espace
    expect(caretIndexForDigitCount("81 000 0001", 9)).toBe(11);
    expect(caretIndexForDigitCount("81 0", 9)).toBe(4); // moins de chiffres que demandé : à la fin
  });
});
