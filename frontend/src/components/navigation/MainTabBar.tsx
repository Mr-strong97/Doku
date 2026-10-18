"use client";

import { BarChart3, Box, Package, ReceiptText, Store } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/config/routes";

import styles from "./MainTabBar.module.css";

const tabs = [
  { label: "Caisse", href: ROUTES.pos, icon: Store, matches: (path: string) => path.startsWith("/pos") },
  { label: "Produits", href: ROUTES.products, icon: Package, matches: (path: string) => path.startsWith("/products") },
  { label: "Stock", href: ROUTES.stock, icon: Box, matches: (path: string) => path.startsWith("/stock") },
  { label: "Ventes", href: ROUTES.sales, icon: ReceiptText, matches: (path: string) => path.startsWith("/sales") },
  { label: "Bilan", href: ROUTES.stats, icon: BarChart3, matches: (path: string) => path.startsWith("/stats") },
];

/** Navigation persistante réservée aux cinq espaces métier principaux (L3). */
export function MainTabBar() {
  const pathname = usePathname();
  const isMainDestination = tabs.some(({ href }) => pathname === href);
  // Les fiches et formulaires sont des écrans empilés : la barre ne doit pas masquer
  // leur action de bas de page. Les cinq destinations racines, elles, l'affichent toujours.
  if (!isMainDestination) return null;
  return <nav className={styles.bar} aria-label="Navigation principale">{tabs.map(({ label, href, icon: Icon, matches }) => <Link className={matches(pathname) ? styles.active : styles.link} href={href} key={label}><Icon size={20}/><span>{label}</span></Link>)}</nav>;
}
