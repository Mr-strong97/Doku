import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordStrength } from "@/components/forms/PasswordStrength/PasswordStrength";

describe("PasswordStrength", () => {
  it.each([
    ["", "À définir"],
    ["abc", "Trop court"],
    ["abcdefgh", "Faible"],
    ["Sucre2026", "Moyen"],
    ["Rose2026!", "Bon"],
    ["Sucre-et-Cafe-2026", "Fort"],
  ])("« %s » → %s", (password, label) => {
    render(<PasswordStrength password={password} />);
    expect(screen.getByText(label)).toBeInTheDocument(); // le niveau est écrit, pas seulement coloré
    expect(screen.getByText("Robustesse :")).toBeInTheDocument();
  });

  it("annonce le niveau aux lecteurs d'écran (zone aria-live)", () => {
    render(<PasswordStrength password="Rose2026!" />);
    expect(screen.getByText("Bon").closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
  });
});
