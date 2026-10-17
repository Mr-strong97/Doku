import type { Metadata } from "next";

import { PosWorkspace } from "@/components/pos/PosWorkspace";

export const metadata: Metadata = { title: "Caisse" };

export default function PosPage() {
  return <PosWorkspace />;
}
