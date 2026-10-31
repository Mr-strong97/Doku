import type { MetadataRoute } from "next";

/** Métadonnées d'installation : toutes les icônes portent le D de Doku. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Doku — Votre caisse",
    short_name: "Doku",
    description: "Votre caisse, même sans Internet.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f8f9ff",
    theme_color: "#0f7075",
    lang: "fr",
    icons: [
      { src: "/icons/doku-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/doku-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/doku-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
