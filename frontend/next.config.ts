import type { NextConfig } from "next";

/**
 * Configuration de Next.js : le contenu généré par le modèle (cacheComponents,
 * partialPrefetching, règle Tailwind pour Turbopack : à ne pas supprimer) + les en-têtes de
 * sécurité de Doku (dossier §17.5 : « en-tête Content-Security-Policy sur le frontend »).
 */

/** Origine de l'API : la seule adresse extérieure que la page a le droit de contacter. */
const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1").origin;
const isProduction = process.env.NODE_ENV === "production";

/**
 * Politique de sécurité du contenu : le navigateur refuse tout ce qui n'est pas listé.
 * « 'unsafe-inline' » reste nécessaire pour les petits scripts et styles que Next.js et
 * React Toastify injectent dans la page. Une politique stricte par jeton (nonce) exigerait
 * un rendu à chaque requête, incompatible avec les pages pré-rendues que le Service Worker
 * met en cache pour le hors ligne : c'est un compromis assumé, compensé par React (qui
 * échappe tout le texte) et par la règle ESLint qui interdit dangerouslySetInnerHTML.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin}`,
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // En développement, la CSP gênerait le rechargement à chaud : elle n'est active qu'en production.
  ...(isProduction
    ? [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      ]
    : []),
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        // CORRECTIF : la règle du modèle visait TOUS les fichiers .css et transformait aussi les
        // *.module.css en CSS global (les classes de chaque composant n'étaient plus appliquées).
        // Tailwind ne doit traiter que les CSS globaux.
        condition: { not: { path: /\.module\.css$/ } },
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
