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
};

export interface TimeEmQuadra {
  jogadores: string[];
  goleiro: string | null;
  vitoriasSeguidas: number;
  /** Sequência de entrada em quadra (menor = está há mais tempo). */
  entrouEm: number;
}

export interface Partida {
  /** epoch ms em que o cronômetro foi (re)iniciado; null = parado. */
  iniciadaEm: number | null;
  acumuladoMs: number;
  placar: [number, number];
}

export type Resultado = 0 | 1 | "empate";

export interface PartidaRegistrada {
  numero: number;
  times: [string[], string[]];
  placar: [number, number];
  resultado: Resultado;
  fimEm: number;
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
