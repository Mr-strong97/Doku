"use client";

import { ArrowLeft, Building2, Copy, Database, HelpCircle, RefreshCw, SearchX, ShieldCheck, Store, WifiOff, type LucideIcon } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/config/routes";
import { notifyInfo } from "@/lib/toast";

import styles from "./TechnicalFallback.module.css";

type FallbackKind = "offline" | "not-found" | "error";
type FallbackContent = { badge: string; title: string; description: string; icon: LucideIcon };
const contents: Record<FallbackKind, FallbackContent> = {
  offline: { badge: "Connexion indisponible", title: "Cette page nécessite Internet", description: "Cette fonctionnalité a besoin d’une connexion pour charger des données distantes. Vos ventes locales et votre stock continuent de fonctionner sur ce téléphone.", icon: WifiOff },
  "not-found": { badge: "Ressource introuvable", title: "Page introuvable", description: "L’adresse demandée n’existe pas ou a été déplacée. Vos ventes, produits et données de caisse restent en sécurité.", icon: SearchX },
  error: { badge: "Protection des données active", title: "Une erreur inattendue est survenue", description: "Vos ventes enregistrées, votre stock et vos données locales sont conservés en sécurité sur ce téléphone.", icon: ShieldCheck },
};
function TerminalCard({ notFound = false }: { notFound?: boolean }) { return <section className={styles.terminalCard}><div><span><Store aria-hidden="true" size={20}/></span><p><b>Terminal Doku POS</b><small>{notFound ? "Caisse prête pour l’encaissement" : "Mode autonome actif"}</small></p><em>{notFound ? "Actif" : "Opérationnel"}</em></div><p><ShieldCheck aria-hidden="true" size={16}/> Encaissement actif <Database aria-hidden="true" size={16}/> Données sécurisées</p></section>; }
function IncidentCode({ value }: { value: string }) { const copy = async () => { try { await navigator.clipboard.writeText(value); notifyInfo("Code d’incident copié."); } catch { notifyInfo(`Code d’incident : ${value}`); } }; return <section className={styles.incident}><p>Code d’incident à communiquer au support</p><div><code>{value}</code><button type="button" onClick={() => void copy()}><Copy aria-hidden="true" size={16}/> Copier</button></div><small><HelpCircle aria-hidden="true" size={15}/> Ne transmettez jamais votre mot de passe.</small></section>; }

/** Filet technique L5 : aucune lecture de donnée métier, utilisable sans réseau. */
export function TechnicalFallback({ kind, incidentCode, retry }: { kind: FallbackKind; incidentCode?: string; retry?: () => void }) {
  const content = contents[kind]; const Icon = content.icon; const isError = kind === "error"; const isNotFound = kind === "not-found"; const handleRetry = retry ?? (() => window.location.reload());
  return <main className={styles.page}><header className={styles.header}>{isNotFound ? <Link href={ROUTES.pos} aria-label="Retour à la caisse"><ArrowLeft aria-hidden="true" size={23}/></Link> : <><b><span>D</span> Doku POS</b><small><ShieldCheck aria-hidden="true" size={14}/> Mode local sécurisé</small></>}</header><section className={styles.content}><div className={styles.iconCircle}><Icon aria-hidden="true" size={52}/></div><p className={styles.badge}>{content.badge}</p><h1>{content.title}</h1><p className={styles.description}>{content.description}</p>{isError ? <><section className={styles.safety}><b><ShieldCheck aria-hidden="true" size={19}/> Données locales protégées</b><span><CheckMark/> Aucune vente perdue</span><span><Database aria-hidden="true" size={16}/> Base locale sécurisée</span><span><Store aria-hidden="true" size={16}/> Encaissement prêt</span></section><IncidentCode value={incidentCode ?? "ERR-LOCAL"}/></> : <TerminalCard notFound={isNotFound}/>}<div className={styles.actions}>{isNotFound ? <><Link className={styles.primary} href={ROUTES.pos}><Building2 aria-hidden="true" size={19}/> Retour à la caisse</Link><Link className={styles.secondary} href={ROUTES.products}><Store aria-hidden="true" size={19}/> Consulter les produits</Link></> : <>{kind === "offline" && <Link className={styles.primary} href={ROUTES.pos}><Building2 aria-hidden="true" size={19}/> Retour à la caisse</Link>}<button type="button" className={isError ? styles.primary : styles.secondary} onClick={handleRetry}><RefreshCw aria-hidden="true" size={19}/> Réessayer</button>{isError && <Link className={styles.secondary} href={ROUTES.pos}><Building2 aria-hidden="true" size={19}/> Retour à la caisse</Link>}</>}</div>{kind !== "error" && <p className={styles.footer}><WifiOff aria-hidden="true" size={16}/> Doku continue de fonctionner hors connexion pour la vente et le stock.</p>}</section></main>;
}
function CheckMark() { return <ShieldCheck aria-hidden="true" size={16}/>; }
