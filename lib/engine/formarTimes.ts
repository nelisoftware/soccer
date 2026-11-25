import type { Contexto } from "./types";
import { podeEntrarNoTime } from "./util";

/**
 * Deriva os times de espera (Time 3, 4, ...) a partir da fila.
 * Cada time pega, em ordem, os primeiros da fila que podem entrar nele. Com a
 * regra de "1 idoso por time", um idoso pula para o próximo time sem idoso.
 * Exceção: se só sobraram idosos e o time ainda tem vaga, eles completam o time
 * (melhor um time com 2 idosos do que dois times incompletos).
 */
export function formarTimesDaFila(fila: readonly string[], ctx: Contexto): string[][] {
  const n = ctx.config.jogadoresPorTime;
  const times: string[][] = [];
  let resto = [...fila];
  while (resto.length > 0) {
    const time: string[] = [];
    const pulados: string[] = [];
    for (const id of resto) {
      if (time.length < n && podeEntrarNoTime(ctx, id, time)) time.push(id);
      else pulados.push(id);
    }
    // Sem gente que respeite a regra para completar: os pulados (idosos) entram.
    while (time.length < n && pulados.length > 0) time.push(pulados.shift()!);
    times.push(ordenarPelaFila(time, fila));
    resto = pulados;
  }
  return times;
}

function ordenarPelaFila(time: string[], fila: readonly string[]): string[] {
  return [...time].sort((a, b) => fila.indexOf(a) - fila.indexOf(b));
}
