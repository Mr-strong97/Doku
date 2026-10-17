/**
 * Notifications (React Toastify), règles du dossier Interfaces §5.3 :
 * 3 secondes, 6 secondes pour une erreur, et jamais plus d'un message à la fois.
 */

import { toast } from "react-toastify";

import { TOAST_DURATION_MS, TOAST_ERROR_DURATION_MS } from "@/config/constants";

/** Remplace le message affiché (et abandonne ceux en attente) par le nouveau. */
function showSingleToast(show: () => void): void {
  toast.clearWaitingQueue();
  toast.dismiss();
  show();
}

export function notifyError(message: string): void {
  showSingleToast(() => toast.error(message, { autoClose: TOAST_ERROR_DURATION_MS }));
}

export function notifyInfo(message: string): void {
  showSingleToast(() => toast.info(message, { autoClose: TOAST_DURATION_MS }));
}
