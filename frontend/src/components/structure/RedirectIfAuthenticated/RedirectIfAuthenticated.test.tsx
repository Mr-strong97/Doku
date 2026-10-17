import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RedirectIfAuthenticated } from "@/components/structure/RedirectIfAuthenticated/RedirectIfAuthenticated";

const { replaceMock, authState } = vi.hoisted(() => ({
  replaceMock: vi.fn(),
  authState: { current: {} as Record<string, unknown> },
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: replaceMock }) }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => authState.current }));

const session = (onboardingCompleted: boolean) => ({ onboarding_completed: onboardingCompleted });

describe("RedirectIfAuthenticated", () => {
  beforeEach(() => replaceMock.mockReset());

  it("session ouverte, configuration terminée : va à la caisse (P04)", () => {
    authState.current = { status: "authenticated", session: session(true) };
    render(<RedirectIfAuthenticated />);
    expect(replaceMock).toHaveBeenCalledWith("/pos");
  });

  it("session ouverte, configuration à faire : va à la configuration initiale (P03)", () => {
    authState.current = { status: "authenticated", session: session(false) };
    render(<RedirectIfAuthenticated />);
    expect(replaceMock).toHaveBeenCalledWith("/onboarding");
  });

  it.each(["loading", "anonymous"])("ne redirige pas quand l'état est « %s »", (status) => {
    authState.current = { status, session: null };
    render(<RedirectIfAuthenticated />);
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
