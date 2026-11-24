"use client";

import { useEffect, useState } from "react";
import type { PartidaRegistrada } from "@/lib/engine";
import { estiloTimes, nomeTime, resolverCor, type CorSala } from "@/lib/cores";
import { IconeTrofeu } from "@/components/icones";
import { Modal } from "@/components/Modal";
import { Botao, cx } from "@/components/ui";

/** Quantas trocas de destaque antes de parar (a última cai no vencedor). */
const TROCAS = 16;

/** Intervalo de cada troca: começa rápido e vai freando. */
function intervalo(passo: number) {
  return 70 + Math.round(passo * passo * 2.2);
}

/**
 * Animação do sorteio de empate: o destaque pula entre os 2 times, desacelera e
 * para em quem ganhou. O resultado já vem sorteado pelo servidor (no histórico).
 */
export function SorteioEmpate({
  partida,
  coresSala,
  onFechar,
}: {
  partida: PartidaRegistrada & { sorteioEmpate: NonNullable<PartidaRegistrada["sorteioEmpate"]> };
  coresSala: CorSala[];
  onFechar: () => void;
}) {
  const { vencedor, regra } = partida.sorteioEmpate;
  const cores = [0, 1].map((i) => {
    const c = partida.cores?.[i];
    return typeof c === "object" ? c : resolverCor(c ?? (i === 0 ? "preto" : "azul"), coresSala);
  }) as [CorSala, CorSala];

  // Número de trocas com a paridade certa para terminar no vencedor (começa no lado 0).
  const total = TROCAS + (TROCAS % 2 === vencedor ? 0 : 1);
  const [passo, setPasso] = useState(0);
  const [semAnimacao] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const terminou = semAnimacao || passo >= total;
  const destaque = terminou ? vencedor : passo % 2;

  useEffect(() => {
    if (terminou) return;
    const t = setTimeout(() => setPasso((p) => p + 1), intervalo(passo));
    return () => clearTimeout(t);
  }, [passo, terminou]);

  const perdedor = vencedor === 0 ? 1 : 0;
  const nomeV = nomeTime(cores[vencedor]);
  const explicacao =
    regra === "saemOsDois"
      ? `Os 2 times saem. O ${nomeV} vai primeiro para a fila, na frente do ${nomeTime(cores[perdedor])}.`
      : `Os dois entraram juntos: o ${nomeV} fica em quadra e o ${nomeTime(cores[perdedor])} sai.`;

  return (
    <Modal aberto titulo="Sorteio do empate" onFechar={onFechar}>
      <div style={estiloTimes(cores)}>
        <p className="text-sm text-muted text-center mb-4">
          Empate em {partida.placar[0]} × {partida.placar[1]}.{" "}
          {regra === "saemOsDois" ? "Sorteando quem volta primeiro..." : "Sorteando quem fica..."}
        </p>

        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((i) => {
            const ativo = destaque === i;
            const ganhou = terminou && i === vencedor;
            return (
              <div
                key={i}
                className={cx(
                  "relative flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-5 transition-[transform,opacity,box-shadow] duration-100",
                  i === 0 ? "border-team-a bg-team-a-soft" : "border-team-b bg-team-b-soft",
                  ativo ? "scale-105 opacity-100 shadow-lg" : "scale-95 opacity-45",
                  ganhou && "sorteio-vencedor",
                )}
              >
                <span
                  className={cx(
                    "h-12 w-12 rounded-full ring-2 ring-inset ring-black/15",
                    i === 0 ? "bg-team-a-tinta" : "bg-team-b-tinta",
                  )}
                />
                <span className={cx("text-center font-bold leading-tight", i === 0 ? "text-team-a" : "text-team-b")}>
                  {nomeTime(cores[i])}
                </span>
                {ganhou && (
                  <span className="absolute -top-3 rounded-full bg-accent text-on-accent p-1.5 shadow">
                    <IconeTrofeu width={16} height={16} />
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 min-h-[4.5rem] text-center" aria-live="polite">
          {terminou && (
            <div className="sorteio-revelar">
              <p className={cx("text-xl font-bold", vencedor === 0 ? "text-team-a" : "text-team-b")}>
                {nomeV} ganhou o sorteio!
              </p>
              <p className="mt-1 text-sm text-muted">{explicacao}</p>
            </div>
          )}
        </div>

        <div className="mt-4 grid gap-2">
          {terminou ? (
            <Botao variante="primario" tamanho="lg" onClick={onFechar}>
              Ok
            </Botao>
          ) : (
            <Botao variante="fantasma" onClick={() => setPasso(total)}>
              Pular animação
            </Botao>
          )}
        </div>
      </div>
    </Modal>
  );
}
