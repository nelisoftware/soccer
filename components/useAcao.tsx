"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import type { RespostaAcao } from "@/lib/resposta";

/** Executa Server Actions dentro de uma transição e guarda a última mensagem de erro. */
export function useAcao() {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarErro = useCallback((msg: string) => {
    setErro(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setErro(null), 5000);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  /**
   * @param otimista roda no início da transição (ex.: aplicar um `useOptimistic`), para a
   *   tela mudar na hora; o React desfaz sozinho quando a transição termina.
   */
  const executar = useCallback(
    (acao: () => Promise<RespostaAcao>, aoConcluir?: () => void, otimista?: () => void) => {
      iniciar(async () => {
        otimista?.();
        try {
          const r = await acao();
          if (!r.ok) mostrarErro(r.erro);
          else aoConcluir?.();
        } catch {
          mostrarErro("Falha de conexão. Recarregue a página e tente de novo.");
        }
      });
    },
    [mostrarErro],
  );

  return { executar, pendente, erro, limparErro: () => setErro(null) };
}

export function Aviso({ erro, onFechar }: { erro: string | null; onFechar: () => void }) {
  if (!erro) return null;
  return (
    <div
      role="alert"
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(5rem+env(safe-area-inset-bottom))] xl:bottom-6 z-50 w-[calc(100%-2rem)] max-w-md rounded-xl bg-danger text-white px-4 py-3 shadow-lg flex items-start gap-3"
    >
      <p className="flex-1 text-sm font-medium">{erro}</p>
      <button type="button" onClick={onFechar} className="text-white/80 hover:text-white text-sm font-semibold">
        OK
      </button>
    </div>
  );
}
