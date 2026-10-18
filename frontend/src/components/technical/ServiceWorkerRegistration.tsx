"use client";

import { useEffect } from "react";

/** Active le repli /offline sans intercepter les requêtes API ou leurs écritures. */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);
  return null;
}
