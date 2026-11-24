import { ErroRegra, type Contexto, type EstadoDia, type Gol, type Partida } from "./types";
import { clonar, ehGoleiro, estaNoDia, temporariosEmQuadra, usaFilaGoleiros } from "./util";

export function partidaZerada(): Partida {
  return { iniciadaEm: null, acumuladoMs: 0, placar: [0, 0] };
}

export function estadoInicial(): EstadoDia {
  return {
    chegada: [],
    fila: [],
    filaGoleiros: [],
    emQuadra: [],
    partida: partidaZerada(),
    seq: 0,
    historico: [],
  };
}

/** Jogador chegou: vai para o fim da fila (ou da fila de goleiros). */
export function registrarChegada(estado: EstadoDia, id: string, ctx: Contexto): EstadoDia {
  if (!ctx.info(id)) throw new ErroRegra("Jogador não encontrado.");
  if (estaNoDia(estado, id)) throw new ErroRegra("Jogador já está na lista.");
  const e = clonar(estado);
  if (!e.chegada.includes(id)) e.chegada.push(id);
  if (usaFilaGoleiros(ctx) && ehGoleiro(ctx, id)) e.filaGoleiros.push(id);
  else e.fila.push(id);
  return e;
}

/** Remove da fila de espera quem foi embora (não mexe em quem está em quadra). */
export function removerDaFila(estado: EstadoDia, id: string): EstadoDia {
  if (temporariosEmQuadra(estado).has(id)) {
    throw new ErroRegra("Ele está em quadra como substituto temporário. Para tirar, use a substituição na quadra.");
  }
  const e = clonar(estado);
  const antes = e.fila.length + e.filaGoleiros.length;
  e.fila = e.fila.filter((x) => x !== id);
  e.filaGoleiros = e.filaGoleiros.filter((x) => x !== id);
  if (e.fila.length + e.filaGoleiros.length === antes) {
    throw new ErroRegra("Jogador não está na fila. Se está em quadra, use a substituição.");
  }
  return e;
}

/** Move um jogador da fila uma posição para cima (-1) ou para baixo (+1), para corrigir a ordem. */
export function moverNaFila(estado: EstadoDia, id: string, delta: -1 | 1): EstadoDia {
  const e = clonar(estado);
  for (const lista of [e.fila, e.filaGoleiros]) {
    const i = lista.indexOf(id);
    if (i === -1) continue;
    const j = i + delta;
    if (j < 0 || j >= lista.length) return e;
    [lista[i], lista[j]] = [lista[j], lista[i]];
    return e;
  }
  throw new ErroRegra("Jogador não está na fila.");
}

export function iniciarCronometro(estado: EstadoDia, ctx: Contexto): EstadoDia {
  if (estado.emQuadra.length !== 2) throw new ErroRegra("Sorteie os times primeiro.");
  const e = clonar(estado);
  if (e.partida.iniciadaEm === null) e.partida.iniciadaEm = ctx.agora;
  return e;
}

export function pausarCronometro(estado: EstadoDia, ctx: Contexto): EstadoDia {
  const e = clonar(estado);
  if (e.partida.iniciadaEm !== null) {
    e.partida.acumuladoMs += Math.max(0, ctx.agora - e.partida.iniciadaEm);
    e.partida.iniciadaEm = null;
  }
  return e;
}

export function zerarCronometro(estado: EstadoDia): EstadoDia {
  const e = clonar(estado);
  e.partida.iniciadaEm = null;
  e.partida.acumuladoMs = 0;
  // Relógio recomeça do zero: a contagem de tempo por jogador também.
  delete e.partida.entradas;
  delete e.partida.tempoSaiu;
  return e;
}

/**
 * Soma (+1) ou tira (-1) um gol do time.
 * @param autor quem fez o gol (precisa estar em quadra nesse time). Sem autor, só o placar muda.
 *   Ao tirar um gol, sai o último gol com autor do time se o placar ficaria menor
 *   que os gols com autor (sem autor, sai primeiro um gol "anônimo").
 */
export function marcarGol(estado: EstadoDia, time: 0 | 1, delta: 1 | -1, autor?: string): EstadoDia {
  if (estado.emQuadra.length !== 2) throw new ErroRegra("Não há partida em andamento.");
  const e = clonar(estado);
  const gols = [...(e.partida.gols ?? [])];
  if (delta === 1) {
    if (autor) {
      const t = e.emQuadra[time];
      if (!t.jogadores.includes(autor) && t.goleiro !== autor) throw new ErroRegra("Esse jogador não está nesse time.");
      gols.push({ id: autor, lado: time });
    }
    e.partida.placar[time]++;
  } else {
    if (e.partida.placar[time] === 0) return e;
    e.partida.placar[time]--;
    // Tirando o gol de um jogador específico, ou o placar ficou menor que os gols com autor.
    const doTime = gols.filter((g) => g.lado === time).length;
    const i = gols.findLastIndex((g) => g.lado === time && (!autor || g.id === autor));
    if (i >= 0 && (autor || doTime > e.partida.placar[time])) gols.splice(i, 1);
  }
  if (gols.length > 0) e.partida.gols = gols;
  else delete e.partida.gols;
  return e;
}

/** Gols de cada jogador (com autor) numa lista de gols. */
export function golsPorJogador(gols: readonly Gol[] | undefined): Map<string, number> {
  const m = new Map<string, number>();
  for (const g of gols ?? []) m.set(g.id, (m.get(g.id) ?? 0) + 1);
  return m;
}

export function tempoDecorridoMs(p: Partida, agora: number): number {
  return p.acumuladoMs + (p.iniciadaEm !== null ? Math.max(0, agora - p.iniciadaEm) : 0);
}

/**
 * Anota uma substituição no relógio da partida (altera `p`): quem sai guarda o
 * tempo que jogou; quem entra começa a contar a partir de agora.
 */
export function anotarTroca(p: Partida, sai: string, entra: string | null | undefined, agora: number): void {
  const t = tempoDecorridoMs(p, agora);
  const entradas = { ...p.entradas };
  const tempoSaiu = { ...p.tempoSaiu };
  tempoSaiu[sai] = (tempoSaiu[sai] ?? 0) + Math.max(0, t - (entradas[sai] ?? 0));
  delete entradas[sai];
  if (entra) entradas[entra] = t;
  p.entradas = entradas;
  p.tempoSaiu = tempoSaiu;
}

/** Tempo em quadra de cada jogador ao fim da partida (quem está em quadra + quem saiu). */
export function temposDaPartida(p: Partida, emQuadra: readonly string[], agora: number): Record<string, number> {
  const total = tempoDecorridoMs(p, agora);
  const tempos: Record<string, number> = { ...p.tempoSaiu };
  for (const id of emQuadra) {
    tempos[id] = (tempos[id] ?? 0) + Math.max(0, total - (p.entradas?.[id] ?? 0));
  }
  return tempos;
}
