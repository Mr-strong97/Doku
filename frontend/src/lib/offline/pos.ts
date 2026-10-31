import { getDatabase, type PendingSale, type PosSnapshot } from "@/lib/db/database";

type ApiProduct = { id: string; name: string; price_usd: string; stock: number; category_name: string | null; image_url: string | null };

export type CachedPosProduct = PosSnapshot["products"][number];

export async function savePosSnapshot(products: ApiProduct[], rate: number | null): Promise<void> {
  const safeRate = Number.isFinite(rate) ? rate : null;
  await getDatabase().posSnapshots.put({
    key: "current",
    rate: safeRate,
    savedAt: new Date().toISOString(),
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      stock: product.stock,
      imageUrl: product.image_url,
      category: product.category_name ?? "Sans catégorie",
      price: Number(product.price_usd) * (safeRate ?? 0),
    })),
  });
}

export function getPosSnapshot(): Promise<PosSnapshot | undefined> { return getDatabase().posSnapshots.get("current"); }

export async function queueSale(sale: Omit<PendingSale, "id" | "createdAt">): Promise<PendingSale> {
  const pending = { ...sale, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  await getDatabase().pendingSales.put(pending);
  return pending;
}

export function getPendingSales(): Promise<PendingSale[]> { return getDatabase().pendingSales.orderBy("createdAt").toArray(); }
export function removePendingSales(ids: string[]): Promise<void> { return getDatabase().pendingSales.bulkDelete(ids); }
