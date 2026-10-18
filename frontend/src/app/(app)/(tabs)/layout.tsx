import type { ReactNode } from "react";

import { MainTabBar } from "@/components/navigation/MainTabBar";

/** L3 : les cinq espaces principaux conservent toujours la même navigation. */
export default function TabsLayout({ children }: { children: ReactNode }) {
  return <>{children}<MainTabBar /></>;
}
