"use client";

import { Archive, Box, Check, ImagePlus, Minus, Pencil, Plus, Save, Tags } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { BottomSheet } from "@/components/ui/BottomSheet/BottomSheet";
import { PageHeader } from "@/components/ui/PageHeader/PageHeader";
import { ProductThumbnail } from "@/components/ui/ProductThumbnail/ProductThumbnail";
import { InlineRefresh, StatePanel } from "@/components/ui/StatePanel/StatePanel";
import { ROUTES } from "@/config/routes";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { apiClient } from "@/lib/api/client";
import { notifyError, notifyInfo } from "@/lib/toast";

import styles from "./CatalogScreens.module.css";

type Category = { id: string; name: string; product_count: number };
type Product = { id: string; name: string; category: string | null; category_name: string | null; price_usd: string; purchase_price_usd: string; low_stock_threshold: number; stock: number; image_url: string | null; is_active: boolean };
type Movement = { id: string; quantity_delta: number; reason: string; created_at: string; stock_after: number };
const cdf = (value: number | string) => `${new Intl.NumberFormat("fr-FR").format(Number(value))} FC`;
const movementLabel = (reason: string) => reason === "restock" ? "Livraison fournisseur" : reason === "sale" ? "Vente au comptoir" : "Ajustement de stock";
const formSignature = (values: { name: string; category: string | null; buy: string; sell: string; threshold: string; stock: string }) => JSON.stringify(values);

function FormButton({ children, tone = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { tone?: "primary" | "secondary" | "danger" }) {
  return <button {...props} type={props.type ?? "button"} className={`${styles.button} ${styles[tone]}`}>{children}</button>;
}

export function ProductFormScreen() {
  const params = useParams<{ id?: string }>();
  const router = useRouter();
  const id = params.id;
  const [categories, setCategories] = useState<Category[]>([]);
  const [chooser, setChooser] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [name, setName] = useState(""); const [category, setCategory] = useState<string | null>(null); const [buy, setBuy] = useState(""); const [sell, setSell] = useState(""); const [threshold, setThreshold] = useState("5"); const [stock, setStock] = useState("0");
  const [image, setImage] = useState<File | null>(null); const [preview, setPreview] = useState<string | null>(null); const [saving, setSaving] = useState(false); const [loaded, setLoaded] = useState(false); const [error, setError] = useState<string | null>(null); const [initial, setInitial] = useState(() => formSignature({ name: "", category: null, buy: "", sell: "", threshold: "5", stock: "0" }));

  const load = useCallback(async () => {
    try {
      const categoryResponse = await apiClient.get<Category[]>("/categories/"); setCategories(categoryResponse.data);
      if (id) { const { data } = await apiClient.get<Product>(`/products/${id}/`); const values = { name: data.name, category: data.category, buy: data.purchase_price_usd, sell: data.price_usd, threshold: String(data.low_stock_threshold), stock: "0" }; setName(values.name); setCategory(values.category); setBuy(values.buy); setSell(values.sell); setThreshold(values.threshold); setPreview(data.image_url); setInitial(formSignature(values)); }
      setLoaded(true);
    } catch { setError("Impossible de charger les données du produit."); }
  }, [id]);
  useEffect(() => { const task = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(task); }, [load]);
  const margin = Number(sell) - Number(buy); const selected = categories.find((item) => item.id === category);
  const dirty = image !== null || formSignature({ name, category, buy, sell, threshold, stock }) !== initial;
  const leave = () => dirty ? setDiscard(true) : router.replace(ROUTES.products);
  const validate = () => { if (!name.trim()) return "Indiquez le nom du produit."; if (!buy || Number(buy) < 0) return "Le prix d’achat est nécessaire pour calculer votre bénéfice."; if (!sell || Number(sell) < 0) return "Indiquez le prix de vente."; if (Number(threshold) < 0 || (!id && Number(stock) < 0)) return "Le stock et le seuil ne peuvent pas être négatifs."; return null; };
  const save = async () => {
    const validation = validate(); if (validation) { setError(validation); return; }
    setSaving(true); setError(null);
    try { const payload = new FormData(); payload.set("name", name.trim()); payload.set("purchase_price_usd", buy); payload.set("price_usd", sell); payload.set("low_stock_threshold", threshold); if (category) payload.set("category", category); if (!id) payload.set("initial_stock", stock); if (image) payload.set("image", image); const response = id ? await apiClient.patch<Product>(`/products/${id}/`, payload) : await apiClient.post<Product>("/products/", payload); notifyInfo("Produit enregistré."); router.replace(`/products/${response.data.id}`); }
    catch { setError("Enregistrement impossible. Vérifiez les informations saisies puis réessayez."); }
    finally { setSaving(false); }
  };
  const pickImage = (file?: File) => { if (!file) return; if (!/image\/(jpeg|png|webp)/.test(file.type) || file.size > 5 * 1024 * 1024) { setError("Choisissez une image JPG, PNG ou WebP de 5 Mo maximum."); return; } setImage(file); setPreview(URL.createObjectURL(file)); };
  if (!loaded && !error) return <main className={styles.page}><PageHeader title={id ? "Modifier le produit" : "Nouveau produit"} fallbackHref={ROUTES.products}/><div className={styles.skeleton} /></main>;
  return <main className={styles.page}><PageHeader title={id ? "Modifier le produit" : "Nouveau produit"} fallbackHref={ROUTES.products} onBack={leave} action={<button type="button" className={styles.headerAction} disabled={saving} onClick={() => void save()}>Enregistrer</button>}/>
    {error && <StatePanel kind="error" title="Vérifiez ce formulaire" detail={error} />}
    <label className={styles.photoPicker}>{preview ? <img /* eslint-disable-line @next/next/no-img-element -- prévisualisation locale d'un fichier avant l'envoi */ src={preview} alt="Aperçu du produit"/> : <><ImagePlus aria-hidden="true" size={28}/><b>Ajouter une photo</b><span>Visible dans votre caisse</span></>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => pickImage(event.target.files?.[0])}/></label><p className={styles.fieldHelp}>JPG, PNG ou WebP · 5 Mo maximum</p>
    <label className={styles.field}>Nom du produit <em>*</em><input value={name} autoFocus={!id} autoComplete="off" onChange={(event) => setName(event.target.value)} placeholder="Ex. Sucre 1 kg"/></label>
    <div className={styles.field}>Catégorie<button type="button" className={styles.selectButton} onClick={() => setChooser(true)}><span>{selected?.name ?? "Aucune catégorie"}</span><Tags aria-hidden="true" size={19}/></button></div>
    <div className={styles.two}><label className={styles.field}>Prix d’achat <em>*</em><input value={buy} inputMode="decimal" onChange={(event) => setBuy(event.target.value)} placeholder="0"/><small>Nécessaire pour calculer votre bénéfice</small></label><label className={styles.field}>Prix de vente <em>*</em><input value={sell} inputMode="decimal" onChange={(event) => setSell(event.target.value)} placeholder="0"/></label></div>
    <p className={styles.margin}>Marge indicative : <b>{cdf(Math.max(0, margin))}</b>{sell && Number(sell) > 0 ? ` (${Math.max(0, Math.round((margin / Number(sell)) * 100))} %)` : ""}</p>
    <div className={styles.two}><label className={styles.field}>Seuil d’alerte<input value={threshold} inputMode="numeric" onChange={(event) => setThreshold(event.target.value)} placeholder="5"/></label>{!id && <label className={styles.field}>Stock initial<input value={stock} inputMode="numeric" onChange={(event) => setStock(event.target.value)} placeholder="0"/><small>Crée le premier mouvement du journal.</small></label>}</div>
    <FormButton disabled={saving} onClick={() => void save()}><Save aria-hidden="true" size={19}/>{saving ? "Enregistrement…" : "Enregistrer le produit"}</FormButton>
    {chooser && <BottomSheet title="Catégorie du produit" onClose={() => setChooser(false)}><p className={styles.sheetLead}>Classez le produit maintenant ou laissez-le sans catégorie.</p><div className={styles.choiceList}><button type="button" className={styles.choice} onClick={() => { setCategory(null); setChooser(false); }}><span><b>Aucune catégorie</b><small>Produit non classé</small></span>{!category && <Check aria-hidden="true" size={20}/>}</button>{categories.map((item) => <button type="button" key={item.id} className={styles.choice} onClick={() => { setCategory(item.id); setChooser(false); }}><span><b>{item.name}</b><small>{item.product_count} produit(s)</small></span>{category === item.id && <Check aria-hidden="true" size={20}/>}</button>)}</div><Link className={styles.sheetLink} href="/products/categories">Gérer les catégories</Link></BottomSheet>}
    {discard && <BottomSheet title="Quitter sans enregistrer ?" onClose={() => setDiscard(false)}><p className={styles.sheetLead}>Les informations saisies sur cette fiche seront perdues.</p><FormButton onClick={() => setDiscard(false)}>Continuer la modification</FormButton><FormButton tone="danger" onClick={() => router.replace(ROUTES.products)}>Quitter et abandonner</FormButton></BottomSheet>}
  </main>;
}

export function ProductDetailScreen() {
  const { id } = useParams<{ id: string }>(); const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null); const [movements, setMovements] = useState<Movement[]>([]); const [mode, setMode] = useState<"restock" | "adjust" | null>(null); const [quantity, setQuantity] = useState("1"); const [selected, setSelected] = useState<Movement | null>(null); const [archiving, setArchiving] = useState(false); const [loadError, setLoadError] = useState(false);
  const load = useCallback(async () => { try { const [p, m] = await Promise.all([apiClient.get<Product>(`/products/${id}/`), apiClient.get<Movement[]>(`/products/${id}/stock-movements/`)]); setProduct(p.data); setMovements(m.data); setLoadError(false); } catch { setLoadError(true); } }, [id]);
  const { refresh, refreshing } = useAutoRefresh(load);
  const move = async () => { if (!mode || !Number(quantity)) return; try { await apiClient.post(`/products/${id}/stock-movements/`, { quantity_delta: Number(quantity), reason: mode === "restock" ? "restock" : "adjustment" }); setMode(null); await refresh(); notifyInfo("Mouvement de stock enregistré."); } catch { notifyError("Mouvement impossible. Vérifiez la quantité."); } };
  const archive = async () => { try { await apiClient.patch(`/products/${id}/archive/`); notifyInfo("Produit archivé."); router.replace(ROUTES.products); } catch { notifyError("Archivage impossible."); } };
  if (loadError && !product) return <main className={styles.page}><PageHeader title="Produit" fallbackHref={ROUTES.products}/><StatePanel kind="error" title="Produit introuvable" detail="Il a peut-être été supprimé ou vous n’y avez plus accès." action={<Link className={styles.sheetLink} href={ROUTES.products}>Retour aux produits</Link>}/></main>;
  if (!product) return <main className={styles.page}><PageHeader title="Produit" fallbackHref={ROUTES.products}/><div className={styles.skeleton}/></main>;
  const low = product.stock <= product.low_stock_threshold; const negative = product.stock < 0;
  return <main className={styles.page}><PageHeader title={product.name} fallbackHref={ROUTES.products} action={<Link className={styles.headerAction} href={`/products/${id}/edit`}>Modifier</Link>}/>
    {negative && <StatePanel kind="error" title="Stock à vérifier" detail="Le stock est négatif. Ajustez-le après inventaire." />}
    <section className={styles.productHero}><ProductThumbnail src={product.image_url} name={product.name} size="large"/><div><p>{product.category_name ?? "Sans catégorie"}</p><h2>{product.name}</h2><span>Prix de vente · <b>{cdf(product.price_usd)}</b></span></div></section>
    <section className={styles.stockCard}><div><span>État du stock</span><b className={low ? styles.lowText : ""}>{negative ? "À vérifier" : low ? "Stock faible" : "Stock normal"}</b></div><strong>{product.stock}<small> unités disponibles</small></strong><p>Seuil d’alerte : <b>{product.low_stock_threshold} unités</b></p><div className={styles.stockDivider}/><p>Prix d’achat : <b>{cdf(product.purchase_price_usd)}</b></p><p>Marge nette : <b>{cdf(Number(product.price_usd) - Number(product.purchase_price_usd))}</b></p></section>
    <div className={styles.actionGrid}><button type="button" onClick={() => { setMode("restock"); setQuantity("1"); }}><Plus aria-hidden="true" size={18}/> Réapprovisionner</button><button type="button" onClick={() => { setMode("adjust"); setQuantity("-1"); }}><Minus aria-hidden="true" size={18}/> Ajuster le stock</button><Link href={`/products/${id}/edit`}><Pencil aria-hidden="true" size={18}/> Modifier</Link><button type="button" className={styles.archiveButton} onClick={() => setArchiving(true)}><Archive aria-hidden="true" size={18}/> Archiver</button></div>
    <section className={styles.journalHead}><h2>Mouvements</h2><InlineRefresh updating={refreshing} onRefresh={() => void refresh()}/></section><div className={styles.movementList}>{movements.map((movement) => <button type="button" className={styles.movement} key={movement.id} onClick={() => setSelected(movement)}><span><b>{movementLabel(movement.reason)}</b><small>{new Date(movement.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</small></span><strong className={movement.quantity_delta < 0 ? styles.negative : ""}>{movement.quantity_delta > 0 ? "+" : ""}{movement.quantity_delta}<small>reste {movement.stock_after}</small></strong></button>)}{!movements.length && <StatePanel kind="empty" title="Aucun mouvement pour le moment" detail="Les ventes et ajustements de ce produit apparaîtront ici."/>}</div>
    {mode && <BottomSheet title={mode === "restock" ? "Réapprovisionner en stock" : "Ajuster le stock"} onClose={() => setMode(null)}><p className={styles.sheetLead}>Stock actuel : <b>{product.stock} unités</b></p><label className={styles.field}>{mode === "restock" ? "Quantité reçue" : "Écart à appliquer (+ ou -)"}<input value={quantity} inputMode="numeric" onChange={(event) => setQuantity(event.target.value)}/></label><div className={styles.quick}>{[1, 5, 10, 20].map((value) => <button type="button" key={value} onClick={() => setQuantity(String(mode === "adjust" ? -value : value))}>{mode === "adjust" ? "-" : "+"}{value}</button>)}</div><FormButton onClick={() => void move()}><Check aria-hidden="true" size={18}/> Confirmer le mouvement</FormButton></BottomSheet>}
    {selected && <BottomSheet title="Détail du mouvement" onClose={() => setSelected(null)}><dl className={styles.movementDetail}><div><dt>Type</dt><dd>{movementLabel(selected.reason)}</dd></div><div><dt>Variation</dt><dd>{selected.quantity_delta > 0 ? "+" : ""}{selected.quantity_delta} unités</dd></div><div><dt>Stock après mouvement</dt><dd>{selected.stock_after} unités</dd></div><div><dt>Date</dt><dd>{new Date(selected.created_at).toLocaleString("fr-FR")}</dd></div></dl></BottomSheet>}
    {archiving && <BottomSheet title={`Archiver « ${product.name} » ?`} onClose={() => setArchiving(false)}><p className={styles.sheetLead}>Le produit disparaîtra de la caisse et du catalogue actif. Son historique et ses mouvements restent conservés.</p><FormButton tone="danger" onClick={() => void archive()}><Archive aria-hidden="true" size={18}/> Archiver le produit</FormButton><FormButton tone="secondary" onClick={() => setArchiving(false)}>Conserver le produit</FormButton></BottomSheet>}
  </main>;
}

export function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]); const [editing, setEditing] = useState<Category | "new" | null>(null); const [name, setName] = useState(""); const [removing, setRemoving] = useState<Category | null>(null); const [error, setError] = useState(false);
  const load = useCallback(async () => { try { const { data } = await apiClient.get<Category[]>("/categories/"); setCategories(data); setError(false); } catch { setError(true); } }, []);
  const { refresh, refreshing } = useAutoRefresh(load);
  const save = async () => { if (!name.trim()) return notifyError("Indiquez le nom de la catégorie."); try { if (editing === "new") await apiClient.post("/categories/", { name: name.trim() }); else if (editing) await apiClient.patch(`/categories/${editing.id}/`, { name: name.trim() }); setEditing(null); await refresh(); notifyInfo("Catégorie enregistrée."); } catch { notifyError("Enregistrement impossible."); } };
  const archive = async () => { if (!removing) return; try { await apiClient.delete(`/categories/${removing.id}/`); setRemoving(null); await refresh(); notifyInfo("Catégorie archivée."); } catch { notifyError("Archivage impossible."); } };
  return <main className={styles.page}><PageHeader title="Catégories" fallbackHref={ROUTES.products} action={<button type="button" className={styles.iconAction} onClick={() => { setName(""); setEditing("new"); }} aria-label="Nouvelle catégorie"><Plus aria-hidden="true" size={22}/></button>}/><p className={styles.pageIntro}>Organisez le catalogue pour retrouver vos articles plus vite à la caisse.</p><div className={styles.categoryTop}><span>{categories.length} catégorie{categories.length > 1 ? "s" : ""} active{categories.length > 1 ? "s" : ""}</span><InlineRefresh updating={refreshing} onRefresh={() => void refresh()}/></div><FormButton onClick={() => { setName(""); setEditing("new"); }}><Plus aria-hidden="true" size={19}/> Nouvelle catégorie</FormButton>
    {error ? <StatePanel kind="error" title="Catégories indisponibles" detail="Vérifiez votre connexion puis réessayez." action={<InlineRefresh updating={refreshing} onRefresh={() => void refresh()}/>} /> : <div className={styles.categoryList}>{categories.map((item) => <article className={styles.category} key={item.id}><span className={styles.categoryIcon}><Box aria-hidden="true" size={20}/></span><div><b>{item.name}</b><small>{item.product_count} produit{item.product_count > 1 ? "s" : ""} associé{item.product_count > 1 ? "s" : ""}</small></div><div className={styles.categoryActions}><button type="button" onClick={() => { setName(item.name); setEditing(item); }}><Pencil aria-hidden="true" size={16}/> Renommer</button><button type="button" onClick={() => setRemoving(item)}><Archive aria-hidden="true" size={16}/> Archiver</button></div></article>)}{!categories.length && <StatePanel kind="empty" title="Aucune catégorie" detail="Les catégories sont facultatives. Vous pouvez en créer une maintenant ou organiser votre catalogue plus tard."/>}</div>}
    {editing && <BottomSheet title={editing === "new" ? "Nouvelle catégorie" : "Renommer la catégorie"} onClose={() => setEditing(null)}><label className={styles.field}>Nom de la catégorie<input autoFocus value={name} onChange={(event) => setName(event.target.value)} placeholder="Ex. Boissons"/></label><FormButton onClick={() => void save()}><Save aria-hidden="true" size={18}/> Enregistrer</FormButton></BottomSheet>}
    {removing && <BottomSheet title={`Archiver « ${removing.name} » ?`} onClose={() => setRemoving(null)}><p className={styles.sheetLead}>Les {removing.product_count} produits resteront dans le catalogue, mais sans catégorie. Aucun article ni historique n’est supprimé.</p><FormButton tone="danger" onClick={() => void archive()}><Archive aria-hidden="true" size={18}/> Archiver la catégorie</FormButton><FormButton tone="secondary" onClick={() => setRemoving(null)}>Conserver la catégorie</FormButton></BottomSheet>}
  </main>;
}
