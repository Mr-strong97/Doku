import type { Metadata } from "next";

import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = { title: "Configuration initiale" };

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
