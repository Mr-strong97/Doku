"use client";

import { useEffect } from "react";

import { TechnicalFallback } from "@/components/technical/TechnicalFallback";

/** Même protection lorsque l'erreur survient avant le rendu de la mise en page racine. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Erreur applicative Doku", error); }, [error]);
  return <html lang="fr"><body><TechnicalFallback kind="error" incidentCode={`ERR-${error.digest ?? "LOCAL"}`} retry={reset}/></body></html>;
}
