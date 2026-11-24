import { ErroRegra, type Contexto, type EstadoDia } from "./types";
import { clonar, podeEntrarNoTime } from "./util";

/**
 * Substitui um jogador (ou o goleiro) de um time em quadra.
 * Entra o primeiro elegível da fila; os times de espera "sobem" automaticamente.
 * @param volta true = o substituído vai para o fim da fila; false = foi embora.
 */
export function substituir(
  estado: EstadoDia,
  jogadorId: string,
  volta: boolean,
  ctx: Contexto,
): EstadoDia {
  const e = clonar(estado);
  const time = e.emQuadra.find((t) => t.jogadores.includes(jogadorId) || t.goleiro === jogadorId);
  if (!time) throw new ErroRegra("Jogador não está em quadra.");

  if (time.goleiro === jogadorId) {
    time.goleiro = e.filaGoleiros.shift() ?? null;
    if (volta) e.filaGoleiros.push(jogadorId);
    return e;
  }

  const restantes = time.jogadores.filter((id) => id !== jogadorId);
  const entra = e.fila.find((id) => podeEntrarNoTime(ctx, id, restantes));
  if (entra) {
    e.fila = e.fila.filter((id) => id !== entra);
    restantes.push(entra);
  }
  time.jogadores = restantes;
  if (volta) e.fila.push(jogadorId);
  return e;
}
