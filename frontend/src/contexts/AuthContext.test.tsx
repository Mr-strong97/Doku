import { act, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { emitSessionExpired } from "@/lib/api/sessionEvents";
import type { AuthSession } from "@/types/auth";

const mocks = vi.hoisted(() => ({
  restoreSession: vi.fn(),
  loginMerchant: vi.fn(),
  registerMerchant: vi.fn(),
  logoutMerchant: vi.fn(),
  flushPendingLogout: vi.fn(),
  refreshAccessToken: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({
  restoreSession: mocks.restoreSession,
  loginMerchant: mocks.loginMerchant,
  registerMerchant: mocks.registerMerchant,
  logoutMerchant: mocks.logoutMerchant,
  flushPendingLogout: mocks.flushPendingLogout,
}));
vi.mock("@/lib/api/refresh", () => ({ refreshAccessToken: mocks.refreshAccessToken }));

const SESSION: AuthSession = {
  user: { id: "u1", phone: "+243810000001", full_name: "Rose Mbuyi", email: null },
  shop: { id: "s1", name: "Boutique", address: null, phone: null, reference_currency_code: "CDF" },
  onboarding_completed: true,
};

/** Dernière valeur du contexte, relevée par <Probe /> (dans un effet : un rendu ne doit rien modifier). */
const latest: { current: ReturnType<typeof useAuth> | null } = { current: null };

function getActions() {
  if (latest.current === null) throw new Error("Probe n'est pas encore affiché");
  return latest.current;
}

function Probe() {
  const auth = useAuth();
  useEffect(() => {
    latest.current = auth;
  });
  return (
    <p>
      {auth.status}|{auth.session?.user.full_name ?? "-"}|{String(auth.sessionExpired)}
    </p>
  );
}

const renderProvider = () =>
  render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );

describe("AuthProvider", () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.flushPendingLogout.mockResolvedValue(undefined);
    mocks.refreshAccessToken.mockResolvedValue({ status: "refreshed", access: "x" });
  });

  it("démarre en chargement, puis ouvre la session gardée sur l'appareil et renouvelle le jeton", async () => {
    mocks.restoreSession.mockResolvedValue(SESSION);
    renderProvider();
    expect(screen.getByText(/^loading/)).toBeInTheDocument();

    expect(await screen.findByText("authenticated|Rose Mbuyi|false")).toBeInTheDocument();
    await waitFor(() => expect(mocks.refreshAccessToken).toHaveBeenCalledTimes(1));
    expect(mocks.flushPendingLogout).not.toHaveBeenCalled();
  });

  it("sans session locale : anonyme, et révoque un jeton laissé par une déconnexion hors ligne", async () => {
    mocks.restoreSession.mockResolvedValue(null);
    renderProvider();

    expect(await screen.findByText("anonymous|-|false")).toBeInTheDocument();
    await waitFor(() => expect(mocks.flushPendingLogout).toHaveBeenCalledTimes(1));
    expect(mocks.refreshAccessToken).not.toHaveBeenCalled();
  });

  it("login ouvre la session, logout la referme", async () => {
    mocks.restoreSession.mockResolvedValue(null);
    mocks.loginMerchant.mockResolvedValue(SESSION);
    mocks.logoutMerchant.mockResolvedValue(undefined);
    renderProvider();
    await screen.findByText("anonymous|-|false");

    await act(() => getActions().login({ phone: "+243810000001", password: "x" }));
    expect(await screen.findByText("authenticated|Rose Mbuyi|false")).toBeInTheDocument();

    await act(() => getActions().logout());
    expect(await screen.findByText("anonymous|-|false")).toBeInTheDocument();
    expect(mocks.logoutMerchant).toHaveBeenCalledTimes(1);
  });

  it("register ouvre aussi la session", async () => {
    mocks.restoreSession.mockResolvedValue(null);
    mocks.registerMerchant.mockResolvedValue(SESSION);
    renderProvider();
    await screen.findByText("anonymous|-|false");

    await act(() => getActions().register({ full_name: "Rose", phone: "+243810000001", password: "x", shop_name: "B" }));

    expect(await screen.findByText("authenticated|Rose Mbuyi|false")).toBeInTheDocument();
  });

  it("signale une session expirée sans fermer la session locale (la caisse reste utilisable)", async () => {
    mocks.restoreSession.mockResolvedValue(SESSION);
    renderProvider();
    await screen.findByText("authenticated|Rose Mbuyi|false");

    act(() => emitSessionExpired());

    expect(await screen.findByText("authenticated|Rose Mbuyi|true")).toBeInTheDocument();
  });

  it("ne reste pas bloqué si la base locale est illisible", async () => {
    mocks.restoreSession.mockRejectedValue(new Error("IndexedDB indisponible"));
    renderProvider();
    expect(await screen.findByText("anonymous|-|false")).toBeInTheDocument();
  });
});
