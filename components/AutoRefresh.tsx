"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Mantém a tela sincronizada com outras pessoas na mesma sala, sem API:
 * re-renderiza os Server Components periodicamente enquanto a aba está visível.
 */
export function AutoRefresh({ intervalo = 3000, pausado = false }: { intervalo?: number; pausado?: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (pausado) return;
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = setInterval(tick, intervalo);
    const aoVoltar = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", aoVoltar);
    };
  }, [router, intervalo, pausado]);

  return null;
}
