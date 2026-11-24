import { ErroRegra, type Contexto, type EstadoDia, type Partida } from "./types";
import { clonar, ehGoleiro, estaNoDia, usaFilaGoleiros } from "./util";

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
  return e;
}

export function marcarGol(estado: EstadoDia, time: 0 | 1, delta: 1 | -1): EstadoDia {
  if (estado.emQuadra.length !== 2) throw new ErroRegra("Não há partida em andamento.");
  const e = clonar(estado);
  e.partida.placar[time] = Math.max(0, e.partida.placar[time] + delta);
  return e;
}

export function tempoDecorridoMs(p: Partida, agora: number): number {
  return p.acumuladoMs + (p.iniciadaEm !== null ? Math.max(0, agora - p.iniciadaEm) : 0);
}
