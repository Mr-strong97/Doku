/**
 * Base locale du téléphone (IndexedDB, via Dexie) : dossier §14.3.
 *
 * Pour l'instant : seulement ce qu'il faut à la session (profil, boutique, métadonnées).
 * Les magasins des produits, ventes et mouvements arriveront avec leurs écrans, sous forme
 * de nouvelles versions du schéma (`this.version(2).stores(...)`).
 */

import Dexie, { type EntityTable } from "dexie";

import type { ShopProfile, UserProfile } from "@/types/auth";

export type MetaEntry = { key: string; value: unknown };
export type PosSnapshot = {
  key: "current";
  products: Array<{ id: string; name: string; price: number; stock: number; category: string; imageUrl: string | null }>;
  rate: number | null;
  savedAt: string;
};
export type PendingSale = {
  id: string;
  currency: "CDF" | "USD";
  items: Array<{ product_id: string; quantity: number }>;
  createdAt: string;
};

export class DokuDatabase extends Dexie {
  // « declare » : on annonce le type sans créer de champ (Dexie crée lui-même les tables)
  declare profile: EntityTable<UserProfile, "id">;
  declare shop: EntityTable<ShopProfile, "id">;
  declare meta: EntityTable<MetaEntry, "key">;
  declare posSnapshots: EntityTable<PosSnapshot, "key">;
  declare pendingSales: EntityTable<PendingSale, "id">;

  constructor() {
    super("doku");
    // La chaîne indique la clé primaire de chaque magasin (« id » ou « key »)
    this.version(1).stores({ profile: "id", shop: "id", meta: "key" });
    this.version(2).stores({ profile: "id", shop: "id", meta: "key", posSnapshots: "key", pendingSales: "id, createdAt" });
  }
}

let database: DokuDatabase | null = null;

/** Ouvre la base à la première utilisation (jamais pendant le rendu côté serveur). */
export function getDatabase(): DokuDatabase {
  database ??= new DokuDatabase();
  return database;
}
