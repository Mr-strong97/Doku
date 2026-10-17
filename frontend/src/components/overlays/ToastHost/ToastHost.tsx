"use client";

import { Slide, ToastContainer } from "react-toastify";

import { TOAST_DURATION_MS } from "@/config/constants";

import styles from "./ToastHost.module.css";

/**
 * Zone d'affichage des notifications (Interfaces §5.5 : ToastHost). Une seule notification
 * à la fois, 3 s (6 s pour une erreur : voir lib/toast.ts).
 *
 * Animations (règle 11) : entrée et sortie par glissement depuis le haut (transition « Slide »
 * de React Toastify) + barre de progression qui montre le temps restant. Survol ou toucher :
 * le minuteur se met en pause, pour laisser le temps de lire.
 */
export function ToastHost() {
  return (
    <ToastContainer
      position="top-center"
      limit={1}
      autoClose={TOAST_DURATION_MS}
      newestOnTop
      closeOnClick
      pauseOnHover
      draggable
      transition={Slide}
      theme="light"
      className={styles.container}
      toastClassName={styles.toast}
    />
  );
}
