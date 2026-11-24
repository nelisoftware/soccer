"use client";

import { useEffect, type ReactNode } from "react";
import { IconeX } from "./icones";

export function Modal({
  aberto,
  titulo,
  onFechar,
  children,
}: {
  aberto: boolean;
  titulo: string;
  onFechar: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!aberto) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
    window.addEventListener("keydown", esc);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = overflow;
    };
  }, [aberto, onFechar]);

  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-label={titulo}>
      <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/50" onClick={onFechar} />
      <div className="relative w-full md:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:pb-5 shadow-xl">
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold">{titulo}</h2>
          <button
            type="button"
            onClick={onFechar}
            aria-label="Fechar"
            className="-m-2 p-2 rounded-lg text-muted hover:text-ink"
          >
            <IconeX />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
