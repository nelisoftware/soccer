import { anotarTroca } from "./chegada";
import { ErroRegra, type Contexto, type EstadoDia } from "./types";
import { clonar, podeEntrarNoTime, temporariosEmQuadra } from "./util";

/**
 * Primeiro da fila que pode entrar no time. Pula quem está em quadra como
 * temporário (inclusive quem está saindo agora, se era temporário).
 */
export function proximoSubstituto(
  estado: EstadoDia,
  restantes: readonly string[],
  ctx: Contexto,
): string | undefined {
  const emQuadra = temporariosEmQuadra(estado);
  const livres = estado.fila.filter((id) => !emQuadra.has(id));
  // Exceção: se só há idosos disponíveis, entra o primeiro deles (melhor que jogar com um a menos).
  return livres.find((id) => podeEntrarNoTime(ctx, id, restantes)) ?? livres[0];
}

/**
 * Substitui um jogador (ou o goleiro) de um time em quadra.
 * Entra o primeiro elegível da fila; os times de espera "sobem" automaticamente.
 * @param volta true = o substituído vai para o fim da fila; false = foi embora.
 *   Se o substituído era temporário, "volta" = continua no lugar dele na fila.
 * @param temporario true = quem entra não perde o lugar na fila: se o time
 *   perder, volta para o time de espera dele; se ganhar, fica em quadra.
 */
export function substituir(
  estado: EstadoDia,
  jogadorId: string,
  volta: boolean,
  ctx: Contexto,
  temporario = false,
): EstadoDia {
  const e = clonar(estado);
  const time = e.emQuadra.find((t) => t.jogadores.includes(jogadorId) || t.goleiro === jogadorId);
  if (!time) throw new ErroRegra("Jogador não está em quadra.");

  if (time.goleiro === jogadorId) {
    if (temporario) throw new ErroRegra("A substituição temporária é só para jogadores de linha.");
    time.goleiro = e.filaGoleiros.shift() ?? null;
    anotarTroca(e.partida, jogadorId, time.goleiro, ctx.agora);
    if (volta) e.filaGoleiros.push(jogadorId);
    return e;
  }

  const eraTemporario = time.temporarios?.includes(jogadorId) ?? false;
  const restantes = time.jogadores.filter((id) => id !== jogadorId);
  let temporarios = (time.temporarios ?? []).filter((id) => id !== jogadorId);
  // Escolhe antes de mexer nos temporários: quem sai não pode ser escolhido de novo.
  const entra = proximoSubstituto(e, restantes, ctx);
  // Temporário que sai: já tem lugar na fila; se foi embora, perde o lugar.
  if (eraTemporario && !volta) e.fila = e.fila.filter((id) => id !== jogadorId);

  if (entra) {
    restantes.push(entra);
    if (temporario) temporarios = [...temporarios, entra];
    else e.fila = e.fila.filter((id) => id !== entra);
  }
  time.jogadores = restantes;
  anotarTroca(e.partida, jogadorId, entra, ctx.agora);
  if (temporarios.length > 0) time.temporarios = temporarios;
  else delete time.temporarios;
  if (volta && !eraTemporario) e.fila.push(jogadorId);
  return e;
}
