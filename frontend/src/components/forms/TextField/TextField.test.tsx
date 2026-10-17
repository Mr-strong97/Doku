import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TextField } from "@/components/forms/TextField/TextField";

describe("TextField", () => {
  it("relie le libellé au champ (lecteurs d'écran, clic sur le libellé)", () => {
    render(<TextField label="Nom complet" name="full_name" />);
    expect(screen.getByLabelText("Nom complet")).toHaveAttribute("name", "full_name");
  });

  it("affiche l'aide quand il n'y a pas d'erreur", () => {
    render(<TextField label="Nom" hint="Aide utile" />);
    expect(screen.getByText("Aide utile")).toBeInTheDocument();
    expect(screen.getByLabelText("Nom")).not.toHaveAttribute("aria-invalid");
  });

  it("annonce l'erreur : aria-invalid, rôle alert et lien aria-describedby", () => {
    render(<TextField label="Nom" hint="Aide" error="Entrez votre nom" />);

    const input = screen.getByLabelText("Nom");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Entrez votre nom");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toBe(alert.id);
    expect(screen.queryByText("Aide")).not.toBeInTheDocument(); // l'erreur remplace l'aide
  });

  it("affiche la mention à droite du libellé", () => {
    render(<TextField label="Nom" labelAside={<span>Obligatoire</span>} />);
    expect(screen.getByText("Obligatoire")).toBeInTheDocument();
  });

  describe("champ mot de passe avec bouton Afficher / Masquer", () => {
    it("masque par défaut, puis révèle et masque à chaque clic", () => {
      render(<TextField label="Mot de passe" type="password" revealToggle="label" />);
      const input = screen.getByLabelText("Mot de passe");
      expect(input).toHaveAttribute("type", "password");

      fireEvent.click(screen.getByRole("button", { name: "Afficher le mot de passe" }));
      expect(input).toHaveAttribute("type", "text");

      fireEvent.click(screen.getByRole("button", { name: "Masquer le mot de passe" }));
      expect(input).toHaveAttribute("type", "password");
    });

    it("le bouton ne soumet jamais le formulaire", () => {
      render(<TextField label="Mot de passe" type="password" revealToggle="icon-label" />);
      expect(screen.getByRole("button")).toHaveAttribute("type", "button");
    });

    it("n'affiche pas le bouton sans l'option, ni sur un champ qui n'est pas un mot de passe", () => {
      const { rerender } = render(<TextField label="Mot de passe" type="password" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      rerender(<TextField label="Nom" type="text" revealToggle="label" />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });
});
