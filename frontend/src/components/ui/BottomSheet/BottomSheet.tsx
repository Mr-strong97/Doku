"use client";

import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";

import styles from "./BottomSheet.module.css";

type BottomSheetProps = { title: string; children: ReactNode; onClose: () => void; labelledBy?: string };

/** Feuille modale commune : fermeture Échap, bouton explicite et focus envoyé dans le dialogue. */
export function BottomSheet({ title, children, onClose, labelledBy }: BottomSheetProps) {
  const generatedId = useId();
  const titleId = labelledBy ?? generatedId;
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { onClose(); return; }
      if (event.key !== "Tab") return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])");
      if (!focusable?.length) { event.preventDefault(); return; }
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [onClose]);
  return <div className={styles.backdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panelRef} tabIndex={-1} className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <div className={styles.handle} aria-hidden="true" />
      <div className={styles.heading}><h2 id={titleId}>{title}</h2><button type="button" onClick={onClose} aria-label="Fermer"><X aria-hidden="true" size={22}/></button></div>
      {children}
    </section>
  </div>;
}
