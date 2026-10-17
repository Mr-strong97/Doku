import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PhoneField } from "@/components/forms/PhoneField/PhoneField";

function renderField(props: Partial<React.ComponentProps<typeof PhoneField>> = {}) {
  const onValueChange = vi.fn();
  render(<PhoneField label="Numéro de téléphone" value="" onValueChange={onValueChange} {...props} />);
  return { input: screen.getByLabelText("Numéro de téléphone"), onValueChange };
}

describe("PhoneField", () => {
  it("affiche le préfixe du pays à côté du champ", () => {
    renderField();
    expect(screen.getByText("+243")).toBeInTheDocument();
  });

  it("utilise le clavier numérique et l'attribut tel", () => {
    const { input } = renderField();
    expect(input).toHaveAttribute("type", "tel");
    expect(input).toHaveAttribute("inputmode", "numeric");
  });

  it("affiche les chiffres regroupés", () => {
    const { input } = renderField({ value: "810000001" });
    expect(input).toHaveValue("81 000 0001");
  });

  it.each([
    ["810000001", "810000001"],
    ["81 000 0001", "810000001"],
    ["0810000001", "810000001"], // le 0 d'appel national est retiré
    ["+243 81 000 0001", "810000001"], // numéro international collé
    ["81abc", "81"],
  ])("transmet les chiffres nationaux de « %s »", (typed, expected) => {
    const { input, onValueChange } = renderField();
    fireEvent.change(input, { target: { value: typed } });
    expect(onValueChange).toHaveBeenCalledWith(expected);
  });

  it("signale l'erreur au champ", () => {
    const { input } = renderField({ error: "Entrez les 9 chiffres de votre numéro" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("9 chiffres");
  });

  it("accepte autoComplete « username » pour les gestionnaires de mots de passe", () => {
    const { input } = renderField({ autoComplete: "username" });
    expect(input).toHaveAttribute("autocomplete", "username");
  });
});
