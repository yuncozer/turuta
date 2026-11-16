"use client";

import { useEffect } from "react";

/** Registra el service worker (app instalable + cupones y cronograma disponibles sin señal). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
