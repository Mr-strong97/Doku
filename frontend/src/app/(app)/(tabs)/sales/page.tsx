import type { Metadata } from "next";
import { SalesHistoryScreen } from "@/components/commerce/CommerceScreens";
export const metadata: Metadata = { title: "Historique des ventes" };
export default function SalesPage() { return <SalesHistoryScreen/>; }
