import "server-only";
import { and, asc, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { db, schema } from "./db";
import type { ConfigSala, EstadoDia, Posicao } from "./engine/types";
import { CONFIG_PADRAO } from "./engine/types";
import { REGEX_CODIGO, normalizarCodigo } from "./validacao";

export interface SalaDTO {
  id: string;
  codigo: string;
  config: ConfigSala;
}

export interface JogadorDTO {
  id: string;
  nome: string;
  posicao: Posicao;
  idoso: boolean;
  mensalista: boolean;
  ativo: boolean;
}

export interface DiaDTO {
  id: string;
  data: string;
  estado: EstadoDia;
  versao: number;
  encerrado: boolean;
  podeDesfazer: boolean;
}

export async function buscarSala(codigo: string): Promise<SalaDTO | null> {
  const c = normalizarCodigo(codigo);
  if (!REGEX_CODIGO.test(c)) return null;
  const [sala] = await db()
    .select({ id: schema.salas.id, codigo: schema.salas.codigo, config: schema.salas.config })
    .from(schema.salas)
    .where(eq(schema.salas.codigo, c))
    .limit(1);
  if (!sala) return null;
  return { ...sala, config: { ...CONFIG_PADRAO, ...sala.config } };
}

export async function listarJogadores(salaId: string, incluirInativos = false): Promise<JogadorDTO[]> {
  const filtro = incluirInativos
    ? eq(schema.jogadores.salaId, salaId)
    : and(eq(schema.jogadores.salaId, salaId), eq(schema.jogadores.ativo, true));
  return db()
    .select({
      id: schema.jogadores.id,
      nome: schema.jogadores.nome,
      posicao: schema.jogadores.posicao,
      idoso: schema.jogadores.idoso,
      mensalista: schema.jogadores.mensalista,
      ativo: schema.jogadores.ativo,
    })
    .from(schema.jogadores)
    .where(filtro)
    .orderBy(asc(schema.jogadores.nome));
}

export async function buscarDiaAberto(salaId: string): Promise<DiaDTO | null> {
  const [dia] = await db()
    .select()
    .from(schema.diasDeJogo)
    .where(and(eq(schema.diasDeJogo.salaId, salaId), eq(schema.diasDeJogo.encerrado, false)))
    .orderBy(desc(schema.diasDeJogo.criadoEm))
    .limit(1);
  if (!dia) return null;
  const [hist] = await db()
    .select({ id: schema.historicoEstado.id })
    .from(schema.historicoEstado)
    .where(eq(schema.historicoEstado.diaId, dia.id))
    .limit(1);
  return {
    id: dia.id,
    data: dia.data,
    estado: dia.estado,
    versao: dia.versao,
    encerrado: dia.encerrado,
    podeDesfazer: Boolean(hist),
  };
}

export interface DiaResumoDTO {
  id: string;
  data: string;
  encerrado: boolean;
  chegada: string[];
}

export async function listarDiasDoPeriodo(salaId: string, de: string, ate: string): Promise<DiaResumoDTO[]> {
  const dias = await db()
    .select({
      id: schema.diasDeJogo.id,
      data: schema.diasDeJogo.data,
      encerrado: schema.diasDeJogo.encerrado,
      estado: schema.diasDeJogo.estado,
    })
    .from(schema.diasDeJogo)
    .where(
      and(
        eq(schema.diasDeJogo.salaId, salaId),
        gte(schema.diasDeJogo.data, de),
        lte(schema.diasDeJogo.data, ate),
      ),
    )
    .orderBy(desc(schema.diasDeJogo.data), desc(schema.diasDeJogo.criadoEm));
  return dias.map((d) => ({ id: d.id, data: d.data, encerrado: d.encerrado, chegada: d.estado.chegada }));
}

/** Avulsos pagos por dia: Map<diaId, Map<jogadorId, valor em centavos>>. */
export async function avulsosPagos(diaIds: string[]): Promise<Map<string, Map<string, number>>> {
  const mapa = new Map<string, Map<string, number>>();
  for (const id of diaIds) mapa.set(id, new Map());
  if (diaIds.length === 0) return mapa;
  const linhas = await db()
    .select({ diaId: schema.avulsos.diaId, jogadorId: schema.avulsos.jogadorId, valor: schema.avulsos.valor })
    .from(schema.avulsos)
    .where(inArray(schema.avulsos.diaId, diaIds));
  for (const l of linhas) mapa.get(l.diaId)?.set(l.jogadorId, l.valor);
  return mapa;
}

/** Mensalidades pagas no mês (YYYY-MM): Map<jogadorId, valor em centavos>. */
export async function mensalidadesPagas(salaId: string, mes: string): Promise<Map<string, number>> {
  const linhas = await db()
    .select({ jogadorId: schema.mensalidades.jogadorId, valor: schema.mensalidades.valor })
    .from(schema.mensalidades)
    .where(and(eq(schema.mensalidades.salaId, salaId), eq(schema.mensalidades.mes, mes)));
  return new Map(linhas.map((l) => [l.jogadorId, l.valor]));
}