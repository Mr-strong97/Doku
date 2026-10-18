"use client";

import { ChevronRight, CircleUserRound, Minus, Plus, Search, ShoppingCart, Store, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { ProductThumbnail } from "@/components/ui/ProductThumbnail/ProductThumbnail";
import { InlineRefresh, StatePanel } from "@/components/ui/StatePanel/StatePanel";
import { ROUTES } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { apiClient } from "@/lib/api/client";
import { notifyError, notifyInfo } from "@/lib/toast";

import styles from "./PosWorkspace.module.css";

type Product = { id: string; name: string; price: number; stock: number; category: string; imageUrl: string | null };
type CartLine = Product & { quantity: number };
type ApiProduct = { id: string; name: string; price_usd: string; stock: number; category_name: string | null; image_url: string | null };
type ApiRate = { rate: string };

const formatCdf = (value: number) => `${new Intl.NumberFormat("fr-FR").format(value)} FC`;
const formatUsd = (value: number) => `$ ${new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;

/** Caisse P04 et encaissement P05 : catalogue actif, panier local et action principale dans la zone du pouce. */
export function PosWorkspace({ checkout = false }: { checkout?: boolean }) {
  const router = useRouter();
  const { session } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [rate, setRate] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tous");
  const [currency, setCurrency] = useState<"CDF" | "USD">("CDF");
  const [cartReady, setCartReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const updateNetwork = () => setOnline(navigator.onLine);
    const restore = window.setTimeout(() => {
      try { setCart(JSON.parse(sessionStorage.getItem("doku-active-cart") ?? "[]") as CartLine[]); }
      catch { sessionStorage.removeItem("doku-active-cart"); }
      setCartReady(true);
      updateNetwork();
    }, 0);
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    return () => { window.clearTimeout(restore); window.removeEventListener("online", updateNetwork); window.removeEventListener("offline", updateNetwork); };
  }, []);

  const loadPosData = useCallback(async () => {
    try {
      const [catalogResponse, rateResponse] = await Promise.all([apiClient.get<ApiProduct[]>("/products/"), apiClient.get<ApiRate[]>("/exchange-rates/")]);
      const exchangeRate = Number(rateResponse.data[0]?.rate);
      setRate(Number.isFinite(exchangeRate) ? exchangeRate : null);
      setProducts(catalogResponse.data.map((product) => ({
        id: product.id,
        name: product.name,
        stock: product.stock,
        imageUrl: product.image_url,
        category: product.category_name ?? "Sans catégorie",
        price: Number(product.price_usd) * (Number.isFinite(exchangeRate) ? exchangeRate : 0),
      })));
      setLoadError(false);
    } catch { setLoadError(true); }
  }, []);
  const { refresh, refreshing, lastUpdated, hasLoaded } = useAutoRefresh(loadPosData);

  const visible = useMemo(() => products.filter((product) => (category === "Tous" || product.category === category) && product.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())), [products, category, query]);
  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const rateText = rate ? new Intl.NumberFormat("fr-FR").format(rate) : "non défini";
  const categories = ["Tous", ...new Set(products.map((product) => product.category))];

  function persist(next: CartLine[]) { sessionStorage.setItem("doku-active-cart", JSON.stringify(next)); }
  function add(product: Product) {
    if (!product.stock) return notifyError("Ce produit n’est plus en stock.");
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id);
      const next = existing ? current.map((line) => line.id === product.id ? { ...line, quantity: Math.min(line.stock, line.quantity + 1) } : line) : [...current, { ...product, quantity: 1 }];
      persist(next);
      return next;
    });
  }
  function changeQuantity(id: string, quantity: number) {
    setCart((current) => {
      const next = quantity < 1 ? current.filter((line) => line.id !== id) : current.map((line) => line.id === id ? { ...line, quantity: Math.min(line.stock, quantity) } : line);
      persist(next);
      return next;
    });
  }
  function clearCart() { setCart([]); sessionStorage.removeItem("doku-active-cart"); }
  async function submitSale() {
    try {
      const response = await apiClient.post<{ id: string }>("/sales/", { currency, items: cart.map((line) => ({ product_id: line.id, quantity: line.quantity })) });
      clearCart();
      notifyInfo("Vente enregistrée.");
      router.push(`/sales/${response.data.id}`);
    } catch { notifyError("Encaissement impossible : vérifiez le stock et le taux du jour."); }
  }

  useEffect(() => { if (checkout && cartReady && !cart.length) router.replace(ROUTES.pos); }, [checkout, cartReady, cart.length, router]);
  if (checkout && cartReady && !cart.length) return null;

  if (checkout) return <main className={styles.shell}><section className={styles.checkout}>
    <PageHeader title="Panier et paiement" fallbackHref={ROUTES.pos} onBack={() => router.push(ROUTES.pos)} action={<button className={styles.textAction} type="button" onClick={clearCart}>Vider</button>} />
    {!online && <p className={styles.networkNotice}><WifiOff aria-hidden="true" size={17}/> Hors connexion : la vente sera gardée sur cet appareil.</p>}
    <p className={styles.rateChip}>Taux utilisé · 1 USD = <b>{rateText} FC</b></p>
    <div className={styles.checkoutLines}>{cart.map((line) => <article className={styles.checkoutLine} key={line.id}>
      <ProductThumbnail src={line.imageUrl} name={line.name} size="small" />
      <div><b>{line.name}</b><span>{formatCdf(line.price)} l’unité</span></div>
      <div className={styles.quantityControl} aria-label={`Quantité de ${line.name}`}><button type="button" onClick={() => changeQuantity(line.id, line.quantity - 1)} aria-label={`Retirer une unité de ${line.name}`}><Minus size={16}/></button><output>{line.quantity}</output><button type="button" onClick={() => changeQuantity(line.id, line.quantity + 1)} aria-label={`Ajouter une unité de ${line.name}`} disabled={line.quantity >= line.stock}><Plus size={16}/></button></div>
      <strong>{formatCdf(line.price * line.quantity)}</strong>
    </article>)}</div>
    <fieldset className={styles.currency}><legend>Devise de la vente</legend><button type="button" className={currency === "CDF" ? styles.selected : ""} onClick={() => setCurrency("CDF")}>Franc congolais (CDF)</button><button type="button" className={currency === "USD" ? styles.selected : ""} onClick={() => setCurrency("USD")}>Dollar US (USD)</button></fieldset>
    <footer className={styles.checkoutFooter}><div><span>Total à encaisser</span><strong>{currency === "CDF" ? formatCdf(total) : formatUsd(total / (rate ?? 1))}</strong></div><button className={styles.primary} type="button" disabled={!rate || !cart.length} onClick={() => void submitSale()}><ShoppingCart aria-hidden="true" size={20}/> Encaisser</button></footer>
  </section></main>;

  return <main className={styles.shell}><section className={styles.pos}>
    <header className={styles.posHeader}><span className={styles.registerIcon}><Store aria-hidden="true" size={21}/></span><div><h1>{session?.shop.name ?? "Votre boutique"}</h1><p><span className={online ? styles.onlineDot : styles.offlineDot} />{online ? "Caisse active" : "Mode hors connexion"} · Vente directe</p></div><Link href="/settings" aria-label="Ouvrir les réglages"><CircleUserRound aria-hidden="true" size={23}/></Link></header>
    {!online && <p className={styles.networkNotice}><WifiOff aria-hidden="true" size={17}/> Votre caisse reste disponible hors connexion.</p>}
    <div className={styles.rateRow}><p><Wifi aria-hidden="true" size={16}/> Taux du jour : <b>1 USD = {rateText} FC</b></p><InlineRefresh updating={refreshing} onRefresh={() => void refresh()} /></div>
    <label className={styles.search}><Search aria-hidden="true" size={20}/><span className="sr-only">Rechercher un produit</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un produit" autoComplete="off" /></label>
    <div className={styles.categories} aria-label="Filtrer par catégorie">{categories.map((name) => <button type="button" aria-pressed={category === name} className={category === name ? styles.categoryActive : ""} onClick={() => setCategory(name)} key={name}>{name}</button>)}</div>
    <div className={styles.listHeading}><h2>Produits</h2>{lastUpdated && <span>Mis à jour à l’instant</span>}</div>
    {!hasLoaded ? <div className="grid gap-2.5" aria-label="Chargement du catalogue"><i className="h-20 animate-pulse rounded-card bg-surface-field"/><i className="h-20 animate-pulse rounded-card bg-surface-field"/><i className="h-20 animate-pulse rounded-card bg-surface-field"/></div> : loadError && !products.length ? <StatePanel kind="error" title="Catalogue indisponible" detail="Vérifiez votre connexion puis réessayez. Vos ventes déjà enregistrées sont conservées." action={<InlineRefresh updating={refreshing} onRefresh={() => void refresh()} />} /> : <div className={styles.productList}>
      {visible.map((product) => <article className={styles.product} key={product.id}>
        <Link href={`/products/${product.id}`} className={styles.productLink} aria-label={`Voir la fiche de ${product.name}`}><ProductThumbnail src={product.imageUrl} name={product.name} /></Link>
        <Link href={`/products/${product.id}`} className={styles.productInfo}><b>{product.name}</b><strong>{formatCdf(product.price)}</strong></Link>
        <span className={product.stock <= 0 ? styles.emptyStock : product.stock <= 5 ? styles.lowStock : styles.stock}>{product.stock <= 0 ? "Épuisé" : product.stock <= 5 ? `Stock faible · ${product.stock}` : `Stock ${product.stock}`}</span>
        <button type="button" disabled={!product.stock || !rate} onClick={() => add(product)} aria-label={`Ajouter ${product.name} au panier`}><Plus aria-hidden="true" size={23}/></button>
      </article>)}
      {cartReady && !visible.length && <StatePanel kind="empty" title={query ? "Aucun produit trouvé" : "Votre catalogue est vide"} detail={query ? "Essayez un autre nom ou changez de catégorie." : "Ajoutez votre premier produit pour commencer à vendre."} action={!query ? <Link className={styles.inlineLink} href="/products/new">Ajouter un produit</Link> : undefined} />}
    </div>}
    <Link className={styles.cartBar} href={ROUTES.checkout}><span><ShoppingCart aria-hidden="true" size={22}/></span><b>Panier · {itemCount} {itemCount > 1 ? "articles" : "article"}<small>Voir le paiement</small></b><em>{formatCdf(total)} <ChevronRight aria-hidden="true" size={18}/></em></Link>
  </section></main>;
}
