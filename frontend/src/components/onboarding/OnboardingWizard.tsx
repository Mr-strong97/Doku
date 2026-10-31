"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, CircleUserRound, ImagePlus, RefreshCw, Store, WifiOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ROUTES } from "@/config/routes";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api/client";
import { productSaveError } from "@/lib/productErrors";

import styles from "./OnboardingWizard.module.css";

type Category = { id: string; name: string };

/** Assistant repris dans l'état local : le taux reste l'étape indispensable avant la caisse. */
export function OnboardingWizard() {
  const router = useRouter();
  const { session } = useAuth();
  const [step, setStep] = useState(2);
  const [rate, setRate] = useState("2800");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [stock, setStock] = useState("0");
  const [threshold, setThreshold] = useState("5");
  const [category, setCategory] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (step !== 3) return;
    let active = true;
    void apiClient.get<Category[]>("/categories/")
      .then(({ data }) => { if (active) setCategories(data); })
      .catch(() => { if (active) setError("Les catégories sont indisponibles pour le moment. Vous pourrez classer ce produit plus tard."); });
    return () => { active = false; };
  }, [step]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const pickImage = (file?: File) => {
    if (!file) return;
    if (!/image\/(jpeg|png|webp)/.test(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Choisissez une image JPG, PNG ou WebP de 5 Mo maximum.");
      return;
    }
    setError("");
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const saveFirstProduct = async () => {
    const hasStartedProduct = Boolean(name.trim() || price || purchasePrice || stock !== "0" || image || category || newCategoryName.trim());
    if (!hasStartedProduct) { router.push(ROUTES.pos); return; }
    if (!name.trim()) { setError("Indiquez le nom du produit ou passez cette étape."); return; }
    if (!Number(price) || Number(price) <= 0) { setError("Indiquez un prix de vente supérieur à 0 FC."); return; }
    if (Number(stock) < 0 || Number(threshold) < 0 || Number(purchasePrice) < 0) {
      setError("Le stock, le seuil et le prix d’achat ne peuvent pas être négatifs.");
      return;
    }
    if (category === "new" && !newCategoryName.trim()) { setError("Donnez un nom à la nouvelle catégorie."); return; }

    setSaving(true);
    setError("");
    try {
      let categoryId = category;
      if (category === "new") {
        const response = await apiClient.post<Category>("/categories/", { name: newCategoryName.trim() });
        categoryId = response.data.id;
      }
      const payload = new FormData();
      payload.set("name", name.trim());
      payload.set("price_usd", (Number(price) / Number(rate)).toFixed(2));
      payload.set("purchase_price_usd", ((Number(purchasePrice) || 0) / Number(rate)).toFixed(2));
      payload.set("initial_stock", stock || "0");
      payload.set("low_stock_threshold", threshold || "5");
      if (categoryId) payload.set("category", categoryId);
      if (image) payload.set("image", image);
      await apiClient.post("/products/", payload);
      router.push(ROUTES.pos);
    } catch (saveError) {
      setError(productSaveError(saveError, image !== null));
    } finally {
      setSaving(false);
    }
  };

  const next = async () => {
    setError("");
    if (step === 1) { setStep(2); return; }
    if (step === 2) {
      if (!Number(rate) || Number(rate) <= 0) { setError("Saisissez un taux supérieur à 0."); return; }
      setSaving(true);
      try { await apiClient.post("/exchange-rates/", { rate }); setStep(3); }
      catch { setError("Le taux n’a pas pu être enregistré. Vérifiez votre connexion puis réessayez."); }
      finally { setSaving(false); }
      return;
    }
    await saveFirstProduct();
  };

  const goBack = () => {
    if (step > 1) { setStep(step - 1); return; }
    if (window.history.length > 1) router.back(); else router.replace(ROUTES.pos);
  };

  return <main className={styles.page}>
    <header><button onClick={goBack} aria-label="Retour"><ArrowLeft aria-hidden="true" /></button><h1>Configuration de la caisse</h1><CircleUserRound aria-hidden="true" /><span><Store aria-hidden="true" size={13} /> {session?.shop.name ?? "Votre boutique"}</span><small><CheckCircle2 aria-hidden="true" size={13} /> Étape {step} sur 3</small></header>
    <div className={styles.steps} aria-label={`Étape ${step} sur 3`}>{[1, 2, 3].map((item) => <i key={item} className={item === step ? styles.current : item < step ? styles.done : ""} />)}</div>
    {step === 1 && <section className={styles.content}><p>Votre boutique</p><h2>Où se trouve votre commerce ?</h2><label>Adresse <input autoComplete="street-address" placeholder="Kinshasa" /></label><label>Téléphone <input autoComplete="tel" inputMode="tel" placeholder="+243…" /></label><label>Devise de référence <select defaultValue="CDF"><option>CDF — Franc congolais</option><option>USD — Dollar américain</option></select></label></section>}
    {step === 2 && <section className={styles.content}><p>Configuration</p><h2>Quel est le taux du jour ?</h2><div className={styles.intro}>Doku l’utilise pour convertir vos ventes entre dollars et francs congolais.</div><div className={styles.rateCard}><b>1 USD =</b><input value={rate} onChange={(event) => setRate(event.target.value)} inputMode="decimal" aria-label="Taux USD en francs congolais" /><strong>FC</strong><small><RefreshCw aria-hidden="true" size={14} /> Modifiable à tout moment dans les réglages</small></div><div className={styles.presets}><button type="button" onClick={() => setRate("2750")}>Calme<b>2 750 FC</b></button><button type="button" onClick={() => setRate("2800")}>Standard<b>2 800 FC</b></button><button type="button" onClick={() => setRate("2850")}>Haut<b>2 850 FC</b></button></div><div className={styles.preview}><b>Aperçu direct en caisse <small><WifiOff aria-hidden="true" size={13} /> Calcul disponible hors connexion</small></b><span>Article test : 5,00 $<strong>{new Intl.NumberFormat("fr-FR").format(Number(rate) * 5)} FC</strong></span><span>Article test : 10,00 $<strong>{new Intl.NumberFormat("fr-FR").format(Number(rate) * 10)} FC</strong></span></div></section>}
    {step === 3 && <section className={styles.content}><p>Premier produit</p><h2>Ajoutez un premier produit</h2><div className={styles.intro}>Cette étape est facultative. Ajoutez les informations utiles maintenant, ou complétez-les plus tard dans le catalogue.</div><label className={styles.photoPicker}>{preview ? <img src={preview} alt="Aperçu du produit" /> : <><ImagePlus aria-hidden="true" size={25} /><b>Ajouter une photo</b><span>Visible dans votre caisse</span></>}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => pickImage(event.target.files?.[0])} /></label><small className={styles.photoHelp}>JPG, PNG ou WebP · 5 Mo maximum</small><label>Nom du produit <input value={name} autoComplete="off" onChange={(event) => setName(event.target.value)} placeholder="Ex. Sucre 1 kg" /></label><label>Catégorie <select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Aucune catégorie</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}<option value="new">Créer une catégorie…</option></select></label>{category === "new" && <label>Nouvelle catégorie <input value={newCategoryName} autoComplete="off" onChange={(event) => setNewCategoryName(event.target.value)} placeholder="Ex. Boissons" /></label>}<div className={styles.twoFields}><label>Prix de vente en FC <input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder="7 000" /></label><label>Prix d’achat en FC <input value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} inputMode="decimal" placeholder="Facultatif" /></label><label>Stock initial <input value={stock} onChange={(event) => setStock(event.target.value)} inputMode="numeric" /></label><label>Seuil d’alerte <input value={threshold} onChange={(event) => setThreshold(event.target.value)} inputMode="numeric" /></label></div></section>}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <button className={styles.continue} disabled={saving} onClick={() => void next()}>{step === 3 ? (name || image || price ? "Terminer" : "Passer cette étape") : "Continuer"}<ArrowRight aria-hidden="true" size={19} /></button>
    {step > 1 && <button className={styles.back} onClick={() => setStep(step - 1)}>Retour à l’étape précédente</button>}
  </main>;
}
