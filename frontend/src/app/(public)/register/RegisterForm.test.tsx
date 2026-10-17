import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { notifyError } from "@/lib/toast";
import { makeApiError, makeNetworkError } from "@/test-utils/apiErrors";

import { RegisterForm } from "./RegisterForm";

const { registerMock } = vi.hoisted(() => ({ registerMock: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ register: registerMock }) }));
vi.mock("@/lib/toast", () => ({ notifyError: vi.fn(), notifyInfo: vi.fn() }));

const field = (label: string) => screen.getByLabelText(label);
const submitButton = () => screen.getByRole("button", { name: /Créer mon compte|Réessayer/ });

function fillValidForm(overrides: Partial<Record<"name" | "phone" | "shop" | "password", string>> = {}) {
  fireEvent.change(field("Nom complet"), { target: { value: overrides.name ?? "  Rose Mbuyi  " } });
  fireEvent.change(field("Numéro de téléphone"), { target: { value: overrides.phone ?? "810000001" } });
  fireEvent.change(field("Nom de la boutique"), { target: { value: overrides.shop ?? " Boutique Maman Rose " } });
  fireEvent.change(field("Mot de passe sécurisé"), { target: { value: overrides.password ?? "Sucre-et-Cafe-2026" } });
}

describe("P02 · RegisterForm", () => {
  beforeEach(() => {
    registerMock.mockReset();
    vi.mocked(notifyError).mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("affiche le contenu de la maquette", () => {
    render(<RegisterForm />);
    expect(screen.getByText("Enregistrez votre commerce en quelques secondes et commencez à vendre")).toBeInTheDocument();
    expect(screen.getByText("Obligatoire")).toBeInTheDocument();
    expect(screen.getByText("Identifiant principal")).toBeInTheDocument();
    expect(screen.getByText("Sur vos reçus")).toBeInTheDocument();
    expect(screen.getByText(/mode hors-ligne automatique/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Se connecter à Doku/ })).toHaveAttribute("href", "/login");
    expect(screen.getByPlaceholderText("Au moins 8 caractères")).toBeInTheDocument();
  });

  it("l'indicateur de robustesse suit la saisie du mot de passe", () => {
    render(<RegisterForm />);
    expect(screen.getByText("À définir")).toBeInTheDocument();

    fireEvent.change(field("Mot de passe sécurisé"), { target: { value: "abc" } });
    expect(screen.getByText("Trop court")).toBeInTheDocument();

    fireEvent.change(field("Mot de passe sécurisé"), { target: { value: "Sucre-et-Cafe-2026" } });
    expect(screen.getByText("Fort")).toBeInTheDocument();
  });

  it("refuse un formulaire vide : quatre erreurs, curseur sur le premier champ", () => {
    render(<RegisterForm />);

    fireEvent.click(submitButton());

    expect(registerMock).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert")).toHaveLength(4);
    expect(field("Nom complet")).toHaveFocus();
  });

  it("refuse un mot de passe de 7 caractères", () => {
    render(<RegisterForm />);
    fillValidForm({ password: "1234567" });

    fireEvent.click(submitButton());

    expect(registerMock).not.toHaveBeenCalled();
    expect(field("Mot de passe sécurisé")).toHaveAttribute("aria-invalid", "true");
  });

  it("envoie les champs nettoyés et le téléphone au format international", async () => {
    registerMock.mockResolvedValue({});
    render(<RegisterForm />);
    fillValidForm();

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(registerMock).toHaveBeenCalledWith({
        full_name: "Rose Mbuyi",
        phone: "+243810000001",
        shop_name: "Boutique Maman Rose",
        password: "Sucre-et-Cafe-2026",
      }),
    );
  });

  it("téléphone déjà utilisé : le message du serveur s'affiche sous le champ téléphone", async () => {
    registerMock.mockRejectedValue(
      makeApiError(400, "VALIDATION_ERROR", { phone: ["Ce numéro est déjà utilisé."] }),
    );
    render(<RegisterForm />);
    fillValidForm();

    fireEvent.click(submitButton());

    expect(await screen.findByText("Ce numéro est déjà utilisé.")).toBeInTheDocument();
    expect(field("Numéro de téléphone")).toHaveAttribute("aria-invalid", "true");
    expect(field("Numéro de téléphone")).toHaveFocus();
    expect(submitButton()).toBeEnabled();
  });

  it("mot de passe refusé par le serveur : le message s'affiche sous le mot de passe", async () => {
    registerMock.mockRejectedValue(
      makeApiError(400, "VALIDATION_ERROR", { password: ["Ce mot de passe est trop courant."] }),
    );
    render(<RegisterForm />);
    fillValidForm({ password: "password" });

    fireEvent.click(submitButton());

    expect(await screen.findByText("Ce mot de passe est trop courant.")).toBeInTheDocument();
    expect(field("Mot de passe sécurisé")).toHaveAttribute("aria-invalid", "true");
  });

  it("réseau injoignable : message explicite sur la création du compte", async () => {
    registerMock.mockRejectedValue(makeNetworkError());
    render(<RegisterForm />);
    fillValidForm();

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("La création du compte nécessite une connexion Internet"),
    );
  });

  it("hors ligne : bandeau, message explicite et aucun appel", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    render(<RegisterForm />);
    expect(screen.getByRole("status")).toHaveTextContent("nécessite une connexion Internet");
    fillValidForm();

    fireEvent.click(submitButton());

    expect(registerMock).not.toHaveBeenCalled();
    expect(notifyError).toHaveBeenCalledWith("La création du compte nécessite une connexion Internet");
  });

  it("trop d'essais (429) : bouton verrouillé avec compte à rebours", async () => {
    registerMock.mockRejectedValue(makeApiError(429, "THROTTLED", { retry_after: 120 }, { "retry-after": "120" }));
    render(<RegisterForm />);
    fillValidForm();

    fireEvent.click(submitButton());

    expect(await screen.findByRole("button", { name: /Réessayer dans 120 s/ })).toBeDisabled();
  });
});
