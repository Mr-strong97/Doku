import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";

import { Providers } from "@/app/providers";
import { messages } from "@/messages/fr";

import "./globals.css";

/**
 * Police Plus Jakarta Sans, hébergée avec l'application (dossier : PWA hors ligne). Aucun
 * appel à Google Fonts : la police se charge même sans réseau une fois l'application installée.
 * `variable` crée la variable CSS --font-jakarta, lue par Tailwind (voir globals.css).
 */
const jakarta = localFont({
  src: [
    { path: "./fonts/PlusJakartaSans-latin-normal.woff2", style: "normal", weight: "200 800" },
    { path: "./fonts/PlusJakartaSans-latin-italic.woff2", style: "italic", weight: "200 800" },
  ],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: messages.brand.name, template: `%s · ${messages.brand.name}` },
  description: messages.brand.tagline,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover", // l'application occupe tout l'écran, encoche comprise (zones de sécurité)
  themeColor: "#f8f9ff",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="fr" className={jakarta.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
