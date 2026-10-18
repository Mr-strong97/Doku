"use client";

import { ChevronLeft, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import styles from "./PageHeader.module.css";

type PageHeaderProps = {
  title: string;
  fallbackHref?: string;
  onBack?: () => void;
  action?: ReactNode;
  icon?: LucideIcon;
};

/** Entête L4 : retour explicite, avec repli stable après ouverture directe d'un lien. */
export function PageHeader({ title, fallbackHref, onBack, action, icon: Icon }: PageHeaderProps) {
  const router = useRouter();
  const handleBack = () => {
    if (onBack) return onBack();
    if (window.history.length > 1) return router.back();
    router.replace(fallbackHref ?? "/pos");
  };

  return (
    <header className={styles.header}>
      <button type="button" className={styles.back} onClick={handleBack} aria-label="Retour">
        <ChevronLeft aria-hidden="true" size={24} strokeWidth={2.2} />
      </button>
      <h1>{Icon && <Icon aria-hidden="true" size={20} strokeWidth={2.1} />}{title}</h1>
      <div className={styles.action}>{action}</div>
    </header>
  );
}
