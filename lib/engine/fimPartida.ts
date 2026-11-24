import { ErroRegra, type Contexto, type EstadoDia, type Resultado } from "./types";
import { partidaZerada } from "./chegada";
import { formarTimesDaFila } from "./formarTimes";
import { clonar, embaralhar, usaFilaGoleiros } from "./util";

/** Quais times saem (índices em quadra), na ordem em que vão para a fila. */
export function timesQueSaem(estado: EstadoDia, resultado: Resultado, ctx: Contexto): number[] {
  const [a, b] = estado.emQuadra;
  if (resultado === "empate") {
    if (ctx.config.regraEmpate === "saemOsDois") return embaralhar([0, 1], ctx.rng);
    if (a.entrouEm !== b.entrouEm) return [a.entrouEm < b.entrouEm ? 0 : 1];
    // Entraram juntos (ex.: primeira partida): sorteia qual sai.
    return [ctx.rng() < 0.5 ? 0 : 1];
  }
  const vencedor = resultado;
  const perdedor = vencedor === 0 ? 1 : 0;
  const max = ctx.config.maxVitoriasSeguidas;
  const vitorias = estado.emQuadra[vencedor].vitoriasSeguidas + 1;
  if (max > 0 && vitorias >= max) return [vencedor, perdedor];
  return [perdedor];
}

/**
 * Encerra a partida:
 * - Quem sai vai para o fim da fila, na ordem do time (completando primeiro o
 *   último time incompleto). O goleiro vai para o fim da fila de goleiros.
 * - Entram os próximos times derivados da fila.
 */
export function finalizarPartida(estado: EstadoDia, resultado: Resultado, ctx: Contexto): EstadoDia {
  if (estado.emQuadra.length !== 2) throw new ErroRegra("Não há partida em andamento.");
  const saem = timesQueSaem(estado, resultado, ctx);
  const e = clonar(estado);

  e.historico.push({
    numero: e.historico.length + 1,
    times: [[...e.emQuadra[0].jogadores], [...e.emQuadra[1].jogadores]],
    placar: [...e.partida.placar],
    resultado,
    fimEm: ctx.agora,
  });

  if (resultado !== "empate") e.emQuadra[resultado].vitoriasSeguidas++;

  for (const idx of saem) {
    const t = e.emQuadra[idx];
    e.fila.push(...t.jogadores);
    if (t.goleiro) e.filaGoleiros.push(t.goleiro);
  }

  for (const idx of [...saem].sort()) {
    const proximo = formarTimesDaFila(e.fila, ctx)[0] ?? [];
    e.fila = e.fila.filter((id) => !proximo.includes(id));
    e.emQuadra[idx] = {
      jogadores: proximo,
      goleiro: usaFilaGoleiros(ctx) ? (e.filaGoleiros.shift() ?? null) : null,
      vitoriasSeguidas: 0,
      entrouEm: e.seq,
    };
  }
  e.seq++;
  e.partida = partidaZerada();
  return e;
}
