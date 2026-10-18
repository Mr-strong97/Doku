import { TechnicalFallback } from "@/components/technical/TechnicalFallback";

/** Repli ciblé par le Service Worker pour une page distante absente du cache. */
export default function OfflinePage() { return <TechnicalFallback kind="offline"/>; }
