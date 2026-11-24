import type { Contexto, EstadoDia, Rng } from "./types";

export function embaralhar<T>(lista: readonly T[], rng: Rng): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ehIdoso(ctx: Contexto, id: string): boolean {
  return ctx.info(id)?.idoso ?? false;
}

export function ehGoleiro(ctx: Contexto, id: string): boolean {
  return ctx.info(id)?.posicao === "goleiro";
}

/** Com a regra "1 idoso por time", o idoso só entra se o time ainda não tem idoso. */
export function podeEntrarNoTime(ctx: Contexto, id: string, time: readonly string[]): boolean {
  if (ctx.config.permiteMaisDeUmIdoso) return true;
  if (!ehIdoso(ctx, id)) return true;
  return !time.some((t) => ehIdoso(ctx, t));
}

/** Usa a fila de goleiros separada? */
export function usaFilaGoleiros(ctx: Contexto): boolean {
  return !ctx.config.goleiroNaLista;
}

export function clonar(e: EstadoDia): EstadoDia {
  return structuredClone(e);
}

export function ordenarPorChegada(ids: string[], chegada: readonly string[]): string[] {
  const pos = new Map(chegada.map((id, i) => [id, i]));
  return [...ids].sort((a, b) => (pos.get(a) ?? 0) - (pos.get(b) ?? 0));
}

export function estaNoDia(e: EstadoDia, id: string): boolean {
  return (
    e.fila.includes(id) ||
    e.filaGoleiros.includes(id) ||
    e.emQuadra.some((t) => t.jogadores.includes(id) || t.goleiro === id)
  );
}
