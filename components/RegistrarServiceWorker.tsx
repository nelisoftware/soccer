"use client";

import { useEffect } from "react";

/** Registra o service worker (necessário para instalar como app e para a página "sem conexão"). */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Em desenvolvimento o SW atrapalha o hot reload: só registra em produção.
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {});
  }, []);
  return null;
}
