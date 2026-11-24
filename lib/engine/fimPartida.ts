import { corDoTime, resolverCor, type CorTime } from "../cores";
import { ErroRegra, type Contexto, type EstadoDia, type Resultado } from "./types";
import { partidaZerada, tempoDecorridoMs } from "./chegada";
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

/** Cor escolhida para o time que entra em cada lado (sem escolha = herda a cor de quem saiu). */
export type CoresEntrada = Partial<Record<0 | 1, CorTime>>;

/**
 * Encerra a partida:
 * - Quem sai vai para o fim da fila, na ordem do time (completando primeiro o
 *   último time incompleto). O goleiro vai para o fim da fila de goleiros.
 * - Entram os próximos times derivados da fila.
 */
export function finalizarPartida(
  estado: EstadoDia,
  resultado: Resultado,
  ctx: Contexto,
  coresEntrada: CoresEntrada = {},
): EstadoDia {
  if (estado.emQuadra.length !== 2) throw new ErroRegra("Não há partida em andamento.");
  for (const cor of Object.values(coresEntrada)) if (cor) exigirCorDaSala(cor, ctx);
  const saem = timesQueSaem(estado, resultado, ctx);
  const e = clonar(estado);
  const coresAntes: [CorTime, CorTime] = [corDoTime(e.emQuadra[0], 0, ctx.config.cores), corDoTime(e.emQuadra[1], 1, ctx.config.cores)];

  e.historico.push({
    numero: e.historico.length + 1,
    times: [[...e.emQuadra[0].jogadores], [...e.emQuadra[1].jogadores]],
    goleiros: [e.emQuadra[0].goleiro, e.emQuadra[1].goleiro],
    // Cópia de nome e tom: o histórico continua certo mesmo se a cor sair da sala depois.
    cores: [resolverCor(coresAntes[0], ctx.config.cores), resolverCor(coresAntes[1], ctx.config.cores)],
    placar: [...e.partida.placar],
    resultado,
    fimEm: ctx.agora,
    duracaoMs: tempoDecorridoMs(e.partida, ctx.agora),
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
      cor: coresEntrada[idx as 0 | 1] ?? coresAntes[idx],
    };
  }
  if (corDoTime(e.emQuadra[0], 0, ctx.config.cores) === corDoTime(e.emQuadra[1], 1, ctx.config.cores)) {
    throw new ErroRegra("Os 2 times em quadra não podem ter a mesma cor.");
  }
  e.seq++;
  e.partida = partidaZerada();
  return e;
}

/** Troca a cor do colete de um time em quadra. Se o outro time já usa essa cor, os dois trocam. */
export function definirCorTime(estado: EstadoDia, lado: 0 | 1, cor: CorTime, ctx: Contexto): EstadoDia {
  if (estado.emQuadra.length !== 2) throw new ErroRegra("Não há times em quadra.");
  exigirCorDaSala(cor, ctx);
  const sala = ctx.config.cores;
  const e = clonar(estado);
  const outro = lado === 0 ? 1 : 0;
  const atual = corDoTime(e.emQuadra[lado], lado, sala);
  const doOutro = corDoTime(e.emQuadra[outro], outro, sala);
  e.emQuadra[outro].cor = doOutro === cor ? atual : doOutro;
  e.emQuadra[lado].cor = cor;
  return e;
}

function exigirCorDaSala(cor: CorTime, ctx: Contexto) {
  if (!ctx.config.cores.some((c) => c.id === cor)) throw new ErroRegra("Essa cor não está nas cores da sala.");
}
