import type { Metadata } from "next";

import { PosWorkspace } from "@/components/pos/PosWorkspace";

export const metadata: Metadata = { title: "Panier et paiement" };

export default function CheckoutPage() {
  return <PosWorkspace checkout />;
}
