import { ErroRegra, type Contexto, type EstadoDia, type TimeEmQuadra } from "./types";
import { corDoTime } from "../cores";
import { partidaZerada } from "./chegada";
import { clonar, ehIdoso, embaralhar, ordenarPorChegada, usaFilaGoleiros } from "./util";

/**
 * Sorteia os 2 primeiros times entre os primeiros 2×N da fila.
 * - Com "1 idoso por time": só os 2 primeiros idosos entram, 1 em cada time;
 *   idosos extras cedem a vaga ao próximo não idoso e continuam na fila (Time 3).
 * - Os demais são sorteados aleatoriamente.
 * - Cada time é exibido em ordem de chegada.
 */
export function sortearTimes(estado: EstadoDia, ctx: Contexto): EstadoDia {
  if (estado.emQuadra.length > 0) throw new ErroRegra("Os times já foram sorteados.");
  const n = ctx.config.jogadoresPorTime;
  const limite = !ctx.config.permiteMaisDeUmIdoso;

  const selecionados: string[] = [];
  let idosos = 0;
  for (const id of estado.fila) {
    if (selecionados.length === 2 * n) break;
    if (limite && ehIdoso(ctx, id)) {
      if (idosos >= 2) continue;
      idosos++;
    }
    selecionados.push(id);
  }
  if (selecionados.length < 2) throw new ErroRegra("Jogadores insuficientes para o sorteio.");

  const idososSel = limite ? embaralhar(selecionados.filter((id) => ehIdoso(ctx, id)), ctx.rng) : [];
  const outros = embaralhar(
    selecionados.filter((id) => !idososSel.includes(id)),
    ctx.rng,
  );

  const tamanhoA = Math.ceil(selecionados.length / 2);
  const a: string[] = [];
  const b: string[] = [];
  if (idososSel[0]) a.push(idososSel[0]);
  if (idososSel[1]) b.push(idososSel[1]);
  for (const id of outros) {
    if (a.length < tamanhoA) a.push(id);
    else b.push(id);
  }

  const e = clonar(estado);
  e.fila = e.fila.filter((id) => !selecionados.includes(id));
  const novoTime = (jogadores: string[], lado: 0 | 1): TimeEmQuadra => ({
    jogadores: ordenarPorChegada(jogadores, e.chegada),
    goleiro: usaFilaGoleiros(ctx) ? (e.filaGoleiros.shift() ?? null) : null,
    vitoriasSeguidas: 0,
    entrouEm: e.seq,
    cor: corDoTime(undefined, lado, ctx.config.cores),
  });
  e.emQuadra = [novoTime(a, 0), novoTime(b, 1)];
  e.seq++;
  e.partida = partidaZerada();
  return e;
}
