import { CORES_INICIAIS, type CorSala, type CorTime } from "../cores";

export type Posicao = "jogador" | "goleiro";

export interface JogadorInfo {
  id: string;
  nome: string;
  posicao: Posicao;
  idoso: boolean;
}

export type RegraEmpate = "saemOsDois" | "saiMaisAntigo";

export interface ConfigSala {
  /** Jogadores por time. Com goleiro fora da lista, conta só a linha. */
  jogadoresPorTime: number;
  /** true = goleiro entra na fila como jogador comum; false = fila separada de goleiros. */
  goleiroNaLista: boolean;
  /** false = no máximo 1 idoso por time. */
  permiteMaisDeUmIdoso: boolean;
  regraEmpate: RegraEmpate;
  /** 0 = sem limite. */
  maxVitoriasSeguidas: number;
  minutosPorPartida: number;
  /** 0 = sem limite de gols. */
  golsParaEncerrar: number;
  /** Valores em centavos. */
  valorAvulso: number;
  valorMensalidade: number;
  /** Cores de colete que a sala usa (as 2 primeiras vão para o sorteio). */
  cores: CorSala[];
}

export const CONFIG_PADRAO: ConfigSala = {
  jogadoresPorTime: 5,
  goleiroNaLista: false,
  permiteMaisDeUmIdoso: false,
  regraEmpate: "saemOsDois",
  maxVitoriasSeguidas: 0,
  minutosPorPartida: 10,
  golsParaEncerrar: 2,
  valorAvulso: 1500,
  valorMensalidade: 5000,
  cores: CORES_INICIAIS,
};

export interface TimeEmQuadra {
  jogadores: string[];
  goleiro: string | null;
  vitoriasSeguidas: number;
  /** Sequência de entrada em quadra (menor = está há mais tempo). */
  entrouEm: number;
  /** Cor do colete. Ausente em estados antigos: usa a cor padrão do lado (ver corDoTime). */
  cor?: CorTime;
  /**
   * Substitutos temporários (também em `jogadores`). Continuam na fila, no lugar
   * deles: se o time sair, voltam para o time de espera; se ficar, viram titulares.
   */
  temporarios?: string[];
}

/** Gol com autor: `lado` é o time que ganhou o gol. */
export interface Gol {
  id: string;
  lado: 0 | 1;
}

export interface Partida {
  /** epoch ms em que o cronômetro foi (re)iniciado; null = parado. */
  iniciadaEm: number | null;
  acumuladoMs: number;
  placar: [number, number];
  /** Gols com autor, em ordem. O placar pode ter mais gols (marcados sem autor). */
  gols?: Gol[];
  /** Tempo de jogo (ms) em que entrou quem entrou no meio da partida (substituição). */
  entradas?: Record<string, number>;
  /** Tempo (ms) já jogado nesta partida por quem saiu numa substituição. */
  tempoSaiu?: Record<string, number>;
}

export type Resultado = 0 | 1 | "empate";

export interface PartidaRegistrada {
  numero: number;
  times: [string[], string[]];
  placar: [number, number];
  resultado: Resultado;
  fimEm: number;
  /** Campos abaixo só existem em partidas registradas depois que foram criados. */
  goleiros?: [string | null, string | null];
  /** Cópia das cores na hora da partida (registros antigos guardavam só o id). */
  cores?: [CorSala | CorTime, CorSala | CorTime];
  /** Tempo de bola rolando, em ms. */
  duracaoMs?: number;
  /**
   * Tempo em quadra (ms) de cada jogador nesta partida, incluindo quem saiu
   * numa substituição. Ausente em registros antigos: vale `duracaoMs` para os times.
   */
  tempos?: Record<string, number>;
  /** Gols com autor (ausente em registros antigos). */
  gols?: Gol[];
  /**
   * Empate decidido no sorteio. `vencedor` é o lado que ganhou:
   * - "saemOsDois": o que vai primeiro para a fila (volta antes);
   * - "saiMaisAntigo" (entraram juntos): o que fica em quadra.
   */
  sorteioEmpate?: { regra: RegraEmpate; vencedor: 0 | 1 };
}

export interface EstadoDia {
  /** Todos que chegaram, em ordem de chegada (inclui quem já foi embora). */
  chegada: string[];
  /** Fila de espera de jogadores (forma os times 3, 4, ...). */
  fila: string[];
  /** Fila de goleiros (usada quando goleiroNaLista = false). */
  filaGoleiros: string[];
  /** Vazio antes do sorteio; depois, sempre 2 times. */
  emQuadra: TimeEmQuadra[];
  partida: Partida;
  seq: number;
  historico: PartidaRegistrada[];
}

export type Rng = () => number;

export interface Contexto {
  config: ConfigSala;
  info: (id: string) => JogadorInfo | undefined;
  rng: Rng;
  agora: number;
}

export class ErroRegra extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErroRegra";
  }
}
