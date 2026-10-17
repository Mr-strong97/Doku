import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { notifyError, notifyInfo } from "@/lib/toast";
import { makeApiError, makeNetworkError } from "@/test-utils/apiErrors";

import { LoginForm } from "./LoginForm";

const { loginMock } = vi.hoisted(() => ({ loginMock: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ login: loginMock }) }));
vi.mock("@/lib/toast", () => ({ notifyError: vi.fn(), notifyInfo: vi.fn() }));

const phoneInput = () => screen.getByLabelText("Numéro de téléphone");
const passwordInput = () => screen.getByLabelText("Mot de passe");
const submitButton = () => screen.getByRole("button", { name: /Se connecter|Réessayer/ });

function fillValidForm() {
  fireEvent.change(phoneInput(), { target: { value: "810000001" } });
  fireEvent.change(passwordInput(), { target: { value: "Sucre-et-Cafe-2026" } });
}

describe("P01 · LoginForm", () => {
  beforeEach(() => {
    loginMock.mockReset();
    vi.mocked(notifyError).mockReset();
    vi.mocked(notifyInfo).mockReset();
  });
  afterEach(() => vi.restoreAllMocks());

  it("affiche le contenu de la maquette", () => {
    render(<LoginForm />);
    expect(screen.getByRole("heading", { level: 1, name: "Doku" })).toBeInTheDocument();
    expect(screen.getByText("Votre caisse, même sans Internet")).toBeInTheDocument();
    expect(screen.getByText("Prêt pour le mode hors-ligne")).toBeInTheDocument();
    expect(screen.getByText("RDC (+243)")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Créer un compte" })).toHaveAttribute("href", "/register");
    expect(screen.getByText("La première connexion nécessite Internet.")).toBeInTheDocument();
  });

  it("refuse un formulaire vide, affiche les erreurs et place le curseur sur le téléphone", () => {
    render(<LoginForm />);

    fireEvent.click(submitButton());

    expect(loginMock).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert")).toHaveLength(2);
    expect(phoneInput()).toHaveAttribute("aria-invalid", "true");
    expect(phoneInput()).toHaveFocus();
  });

  it("efface l'erreur d'un champ dès qu'on le corrige", () => {
    render(<LoginForm />);
    fireEvent.click(submitButton());
    expect(phoneInput()).toHaveAttribute("aria-invalid", "true");

    fireEvent.change(phoneInput(), { target: { value: "810000001" } });

    expect(phoneInput()).not.toHaveAttribute("aria-invalid");
  });

  it("envoie le téléphone au format international et le mot de passe tel quel", async () => {
    loginMock.mockResolvedValue({});
    render(<LoginForm />);
    fillValidForm();

    fireEvent.click(submitButton());

    await waitFor(() => expect(loginMock).toHaveBeenCalledWith({ phone: "+243810000001", password: "Sucre-et-Cafe-2026" }));
  });

  it("empêche le double envoi pendant que la requête est en cours", async () => {
    let finish: (value: unknown) => void = () => undefined;
    loginMock.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    render(<LoginForm />);
    fillValidForm();

    fireEvent.click(submitButton());
    fireEvent.click(submitButton());

    expect(loginMock).toHaveBeenCalledTimes(1);
    expect(submitButton()).toBeDisabled();
    expect(submitButton()).toHaveAttribute("aria-busy", "true");
    finish({});
  });

  it("identifiants invalides : message générique et retour sur le mot de passe", async () => {
    loginMock.mockRejectedValue(makeApiError(401, "INVALID_CREDENTIALS"));
    render(<LoginForm />);
    fillValidForm();

    fireEvent.click(submitButton());

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith("Identifiants invalides"));
    expect(passwordInput()).toHaveFocus();
    expect(submitButton()).toBeEnabled(); // on peut réessayer
  });

  it("trop d'essais (429) : bouton verrouillé avec compte à rebours", async () => {
    loginMock.mockRejectedValue(makeApiError(429, "THROTTLED", { retry_after: 30 }, { "retry-after": "30" }));
    render(<LoginForm />);
    fillValidForm();

    fireEvent.click(submitButton());

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith("Trop d'essais. Réessayez dans 30 s."));
    const locked = screen.getByRole("button", { name: /Réessayer dans 30 s/ });
    expect(locked).toBeDisabled();
    fireEvent.click(locked);
    expect(loginMock).toHaveBeenCalledTimes(1); // aucun nouvel essai pendant l'attente
  });

  it("réseau injoignable : message « première connexion »", async () => {
    loginMock.mockRejectedValue(makeNetworkError());
    render(<LoginForm />);
    fillValidForm();

    fireEvent.click(submitButton());

    await waitFor(() =>
      expect(notifyError).toHaveBeenCalledWith("Une connexion Internet est nécessaire pour la première connexion"),
    );
  });

  it("erreur inattendue : message général", async () => {
    loginMock.mockRejectedValue(makeApiError(500, "SERVER_ERROR"));
    render(<LoginForm />);
    fillValidForm();

    fireEvent.click(submitButton());

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith("Une erreur est survenue. Réessayez."));
  });

  it("hors ligne : bandeau d'avertissement et aucun appel réseau", () => {
    vi.spyOn(window.navigator, "onLine", "get").mockReturnValue(false);
    render(<LoginForm />);
    expect(screen.getByRole("status")).toHaveTextContent("Une connexion Internet est nécessaire");
    fillValidForm();

    fireEvent.click(submitButton());

    expect(loginMock).not.toHaveBeenCalled();
    expect(notifyError).toHaveBeenCalledWith("Une connexion Internet est nécessaire pour la première connexion");
  });

  it("« Oublié ? » explique que la réinitialisation n'existe pas encore (hors MVP)", () => {
    render(<LoginForm />);
    fireEvent.click(screen.getByRole("button", { name: "Oublié ?" }));
    expect(notifyInfo).toHaveBeenCalledWith("La réinitialisation du mot de passe n'est pas encore disponible.");
  });
});
