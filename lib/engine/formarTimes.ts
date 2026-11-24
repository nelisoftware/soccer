import type { Contexto } from "./types";
import { podeEntrarNoTime } from "./util";

/**
 * Deriva os times de espera (Time 3, 4, ...) a partir da fila.
 * Cada jogador, em ordem, vai para o primeiro time com vaga. Com a regra de
 * "1 idoso por time", um idoso pula para o primeiro time que ainda não tem idoso.
 */
export function formarTimesDaFila(fila: readonly string[], ctx: Contexto): string[][] {
  const n = ctx.config.jogadoresPorTime;
  const times: string[][] = [];
  for (const id of fila) {
    const alvo = times.find((t) => t.length < n && podeEntrarNoTime(ctx, id, t));
    if (alvo) alvo.push(id);
    else times.push([id]);
  }
  return times;
}
