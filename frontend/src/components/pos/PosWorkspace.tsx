"use client";

import { ArrowLeft, ChevronRight, CircleUserRound, CreditCard, FileText, LayoutGrid, Package, Plus, Search, ShoppingCart, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ROUTES } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api/client";
import { notifyError, notifyInfo } from "@/lib/toast";

import styles from "./PosWorkspace.module.css";

type Product = { id: string; name: string; price: number; stock: number; category: string };
type CartLine = Product & { quantity: number };
type ApiProduct = { id: string; name: string; price_usd: string; stock: number; category_name: string | null };
type ApiRate = { rate: string };

const formatCdf = (value: number) => `${new Intl.NumberFormat("fr-FR").format(value)} FC`;

function BottomNav() {
  const tabs = [["Caisse", WalletCards, ROUTES.pos], ["Produits", Package, "#"], ["Stock", LayoutGrid, "#"], ["Ventes", FileText, "#"], ["Bilan", CreditCard, "#"]] as const;
  return <nav className={styles.nav} aria-label="Navigation principale">{tabs.map(([label, Icon, href]) => <Link className={label === "Caisse" ? styles.activeTab : styles.tab} href={href} key={label}><Icon size={20}/><span>{label}</span></Link>)}</nav>;
}

/** Lit le catalogue, taux et identité de la boutique réellement connectée. */
export function PosWorkspace({ checkout = false }: { checkout?: boolean }) {
  const router = useRouter();
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(sessionStorage.getItem("doku-active-cart") ?? "[]") as CartLine[]; } catch { return []; }
  });
  const [rate, setRate] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [currency, setCurrency] = useState<"CDF" | "USD">("CDF");
  const [cartReady] = useState(true);

  useEffect(() => {
    let stopped = false;
    async function loadPosData() {
      try {
        const [catalogResponse, rateResponse] = await Promise.all([
          apiClient.get<ApiProduct[]>("/products/"), apiClient.get<ApiRate[]>("/exchange-rates/"),
        ]);
        const exchangeRate = Number(rateResponse.data[0]?.rate);
        if (stopped) return;
        setRate(Number.isFinite(exchangeRate) ? exchangeRate : null);
        setProducts(catalogResponse.data.map((product) => ({
          id: product.id, name: product.name, stock: product.stock,
          category: product.category_name ?? "Sans catégorie",
          price: Number(product.price_usd) * (Number.isFinite(exchangeRate) ? exchangeRate : 0),
        })));
      } catch {
        if (!stopped) notifyError("Impossible de charger les données de votre boutique.");
      }
    }
    void loadPosData();
    return () => { stopped = true; };
  }, []);

  const visible = useMemo(() => products.filter((product) => (category === "Tous" || product.category === category) && product.name.toLowerCase().includes(query.toLowerCase())), [products, category, query]);
  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const rateText = rate ? new Intl.NumberFormat("fr-FR").format(rate) : "non défini";
  const categories = ["Tous", ...new Set(products.map((product) => product.category))];

  function add(product: Product) {
    if (!product.stock) return notifyError("Ce produit n’est plus en stock.");
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id);
      const next = existing ? current.map((line) => line.id === product.id ? { ...line, quantity: Math.min(line.stock, line.quantity + 1) } : line) : [...current, { ...product, quantity: 1 }];
      sessionStorage.setItem("doku-active-cart", JSON.stringify(next));
      return next;
    });
  }

  function changeQuantity(id: string, quantity: number) {
    setCart((current) => { const next = quantity < 1 ? current.filter((line) => line.id !== id) : current.map((line) => line.id === id ? { ...line, quantity } : line); sessionStorage.setItem("doku-active-cart", JSON.stringify(next)); return next; });
  }

  async function submitSale() {
    try {
      await apiClient.post("/sales/", { currency, items: cart.map((line) => ({ product_id: line.id, quantity: line.quantity })) });
      setCart([]); sessionStorage.removeItem("doku-active-cart"); notifyInfo("Vente enregistrée."); router.push(ROUTES.pos);
    } catch { notifyError("Encaissement impossible : vérifiez le stock et le taux."); }
  }

  if (checkout && cartReady && !cart.length) { router.replace(ROUTES.pos); return null; }

  if (checkout) return <main className={styles.shell}><section className={styles.checkout}>
    <header className={styles.checkoutHeader}><button onClick={() => router.push(ROUTES.pos)} aria-label="Retour"><ArrowLeft/></button><h1>Panier</h1><button className={styles.clearLink} onClick={() => { setCart([]); sessionStorage.removeItem("doku-active-cart"); }}>Vider</button></header>
    <span className={styles.rateChip}>1 USD = {rateText} FC</span>
    <div className={styles.checkoutLines}>{cart.map((line) => <article className={styles.checkoutLine} key={line.id}><div><b>{line.name}</b><small>{formatCdf(line.price)} l’unité</small></div><input className={styles.quantityBadge} value={line.quantity} min="1" max={line.stock} type="number" aria-label={`Quantité ${line.name}`} onChange={(event) => changeQuantity(line.id, Math.min(line.stock, Number(event.target.value)))}/><button className={styles.lineRemove} onClick={() => changeQuantity(line.id, 0)}>×</button><strong>{formatCdf(line.price * line.quantity)}</strong></article>)}</div>
    <p className={styles.label}>Devise de la vente</p><div className={styles.currency}><button className={currency === "CDF" ? styles.selected : ""} onClick={() => setCurrency("CDF")}>CDF</button><button className={currency === "USD" ? styles.selected : ""} onClick={() => setCurrency("USD")}>USD</button></div><small className={styles.usedRate}>Taux utilisé : 1 USD = {rateText} FC</small>
    <div className={styles.payment}><small>TOTAL</small><strong>{currency === "CDF" ? formatCdf(total) : `$ ${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2 }).format(total / (rate ?? 1))}`}</strong></div><button className={styles.primary} disabled={!rate} onClick={() => void submitSale()}>Encaisser {currency === "CDF" ? formatCdf(total) : "$"}</button>
  </section><BottomNav/></main>;

  return <main className={styles.shell}><section className={styles.pos}>
    <header className={styles.posHeader}><span className={styles.registerIcon}><WalletCards/></span><div><h1>Caisse <small>● Hors-ligne</small></h1><p>{session?.shop.name ?? "Chargement…"} • {session?.shop.reference_currency_code ?? "CDF"} / USD</p></div><Search/><CircleUserRound/></header>
    <div className={styles.storeTitle}><div><h2>{session?.shop.name ?? "Votre boutique"}</h2><p>● Caisse active • Vente directe</p></div></div>
    <div className={styles.rateBar}>⟳ <span>Taux du jour :</span> <b>1 USD = {rateText} FC</b></div>
    <label className={styles.search}><Search size={19}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un produit"/></label>
    <div className={styles.categories}>{categories.map((name) => <button className={category === name ? styles.categoryActive : ""} onClick={() => setCategory(name)} key={name}>{name}</button>)}</div>
    <div className={styles.productList}>{visible.map((product) => <article className={styles.product} key={product.id}><span className={styles.productImage}>{product.name.slice(0, 1)}</span><div><b>{product.name}</b><strong>{formatCdf(product.price)}</strong></div><small className={product.stock <= 5 ? styles.lowStock : ""}>{product.stock <= 5 ? `● Stock faible • ${product.stock}` : `Stock ${product.stock}`}</small><button disabled={!product.stock || !rate} onClick={() => add(product)} aria-label={`Ajouter ${product.name}`}><Plus/></button></article>)}{cartReady && !visible.length && <p className={styles.emptyState}>{query ? "Aucun produit ne correspond à votre recherche." : "Votre catalogue est vide. Ajoutez votre premier produit dans la configuration."}</p>}</div>
    <Link className={styles.cartBar} href={ROUTES.checkout}><span><ShoppingCart/></span><b>Panier • {itemCount} articles<small>Appuyer pour voir le détail</small></b><em>{formatCdf(total)} <ChevronRight/></em></Link>
  </section><BottomNav/></main>;
}
