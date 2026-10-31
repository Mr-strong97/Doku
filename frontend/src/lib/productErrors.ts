import { getFieldErrors, toApiError } from "@/lib/api/errors";

const fieldLabels: Record<string, string> = {
  category: "Catégorie",
  image: "Photo",
  initial_stock: "Stock initial",
  low_stock_threshold: "Seuil d’alerte",
  name: "Nom du produit",
  price_usd: "Prix de vente",
  purchase_price_usd: "Prix d’achat",
};

/**
 * Traduit l'erreur normalisée de l'API en une indication actionnable pour la
 * fiche produit. Les détails de validation Django ne sont ainsi plus perdus.
 */
export function productSaveError(error: unknown, hasImage = false): string {
  const apiError = toApiError(error);
  if (apiError.kind === "network" || apiError.kind === "timeout") {
    return "Impossible de joindre Doku. Vérifiez votre connexion puis réessayez.";
  }

  const [field, message] = Object.entries(getFieldErrors(apiError))[0] ?? [];
  if (field && message) return `${fieldLabels[field] ?? field} : ${message}`;

  if (apiError.status === 500 && hasImage) {
    return "La photo n’a pas pu être enregistrée. Vérifiez la configuration du stockage puis réessayez.";
  }

  return "Enregistrement impossible. Réessayez dans un instant.";
}
