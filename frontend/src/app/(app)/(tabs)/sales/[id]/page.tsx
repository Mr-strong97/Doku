import type { Metadata } from "next";
import { SaleReceiptScreen } from "@/components/commerce/CommerceScreens";
export const metadata: Metadata = { title: "Reçu de vente" };
export default function SalePage() { return <SaleReceiptScreen/>; }
