"use client";

import { useEffect } from "react";

import { TechnicalFallback } from "@/components/technical/TechnicalFallback";

/** Dernier filet de sécurité : aucun détail de l’exception n’est montré au commerçant. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Erreur applicative Doku", error); }, [error]);
  return <TechnicalFallback kind="error" incidentCode={`ERR-${error.digest ?? "LOCAL"}`} retry={reset}/>;
}
