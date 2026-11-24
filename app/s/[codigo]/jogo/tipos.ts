import type { DiaDTO, JogadorDTO } from "@/lib/dal";
import type { ConfigSala, Contexto } from "@/lib/engine";
import type { RespostaAcao } from "@/lib/resposta";

export interface AcoesJogo {
  codigo: string;
  dia: DiaDTO;
  editavel: boolean;
  pendente: boolean;
  /** Executa uma Server Action do dia passando codigo, diaId e versão atuais. */
  rodar: (
    fn: (codigo: string, diaId: string, versao: number) => Promise<RespostaAcao>,
    aoConcluir?: () => void,
  ) => void;
}

export interface DadosJogo {
  config: ConfigSala;
  jogadores: Map<string, JogadorDTO>;
  /** Contexto do motor para cálculos de exibição (sem aleatoriedade). */
  ctx: Contexto;
}

export function nome(dados: DadosJogo, id: string): string {
  return dados.jogadores.get(id)?.nome ?? "?";
}
