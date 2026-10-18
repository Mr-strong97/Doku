import type { Metadata } from "next";
import { ProductsScreen } from "@/components/commerce/CommerceScreens";
export const metadata: Metadata = { title: "Produits" };
export default function ProductsPage() { return <ProductsScreen/>; }
