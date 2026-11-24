"use client";

import { resolverCor, varsCor, type CorSala, type CorTime } from "@/lib/cores";
import { cx } from "@/components/ui";

/** Bolinhas com as cores de colete da sala, grandes o bastante para tocar na beira da quadra. */
export function SeletorCor({
  cores,
  valor,
  emUso = [],
  bloqueadas = [],
  onEscolher,
  desabilitado,
  rotulo,
}: {
  /** Cores da sala (Config). */
  cores: CorSala[];
  valor: CorTime;
  /** Cor do outro time: aparece marcada e, se escolhida, os dois trocam. */
  emUso?: CorTime[];
  /** Cores que não podem ser escolhidas (time que fica em quadra). */
  bloqueadas?: CorTime[];
  onEscolher: (cor: CorTime) => void;
  desabilitado?: boolean;
  rotulo: string;
}) {
  // A cor atual pode ter saído das cores da sala: continua aparecendo para não sumir da tela.
  const lista = cores.some((c) => c.id === valor) ? cores : [resolverCor(valor, cores), ...cores];
  return (
    <div role="radiogroup" aria-label={rotulo} className="grid grid-cols-4 sm:grid-cols-5 gap-2">
      {lista.map((cor) => {
        const ativo = valor === cor.id;
        const bloqueada = bloqueadas.includes(cor.id) && !ativo;
        const usada = emUso.includes(cor.id) && !ativo;
        return (
          <button
            key={cor.id}
            type="button"
            role="radio"
            aria-checked={ativo}
            disabled={desabilitado || bloqueada}
            onClick={() => onEscolher(cor.id)}
            title={
              bloqueada
                ? `${cor.nome}: cor do time que fica em quadra`
                : usada
                  ? `${cor.nome}: está com o outro time (os dois trocam)`
                  : cor.nome
            }
            style={varsCor(cor)}
            className={cx(
              "relative flex flex-col items-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium transition disabled:opacity-30",
              ativo ? "bg-team-a-soft text-ink ring-2 ring-team-a" : "text-muted hover:bg-surface-2",
            )}
          >
            <span className="h-8 w-8 shrink-0 aspect-square rounded-full bg-team-a-tinta ring-1 ring-inset ring-black/20" />
            <span className="max-w-full truncate">{cor.nome}</span>
            {usada && (
              <span className="absolute top-0.5 right-0.5 rounded bg-surface-2 px-1 text-[9px] font-semibold uppercase text-muted">
                outro
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
