import "server-only";
import { and, asc, desc, eq, gte, inArray, lte, ne, sql } from "drizzle-orm";
import { CODIGO_ADMIN } from "./auth";
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
  // A linha "admin" só guarda o PIN/bloqueio do administrador; não é uma sala de jogo.
  if (!REGEX_CODIGO.test(c) || c === CODIGO_ADMIN) return null;
  const [sala] = await db()
    .select({ id: schema.salas.id, codigo: schema.salas.codigo, config: schema.salas.config })
    .from(schema.salas)
    .where(eq(schema.salas.codigo, c))
    .limit(1);
  if (!sala) return null;
  return { ...sala, config: { ...CONFIG_PADRAO, ...sala.config } };
}

export interface SalaAdminDTO {
  id: string;
  codigo: string;
  criadoEm: string;
  bloqueadaAte: string | null;
  jogadores: number;
  mensalistas: number;
  dias: number;
  ultimoDia: string | null;
  diaAberto: boolean;
}

/** Todas as salas com um resumo, para o painel do administrador. */
export async function listarSalasAdmin(): Promise<SalaAdminDTO[]> {
  const s = schema.salas;
  // Em consultas de uma tabela só, o Drizzle escreve ${s.id} como "id" sem prefixo; dentro da
  // subconsulta isso viraria o id do jogador/dia. Por isso a coluna da sala vai qualificada.
  const idSala = sql.raw(`"salas"."id"`);
  const linhas = await db()
    .select({
      id: s.id,
      codigo: s.codigo,
      criadoEm: s.criadoEm,
      bloqueadoAte: s.bloqueadoAte,
      jogadores: sql<number>`(select count(*)::int from ${schema.jogadores} j where j.sala_id = ${idSala} and j.ativo)`,
      mensalistas: sql<number>`(select count(*)::int from ${schema.jogadores} j where j.sala_id = ${idSala} and j.ativo and j.mensalista)`,
      dias: sql<number>`(select count(*)::int from ${schema.diasDeJogo} d where d.sala_id = ${idSala})`,
      ultimoDia: sql<string | null>`(select max(d.data)::text from ${schema.diasDeJogo} d where d.sala_id = ${idSala})`,
      diaAberto: sql<boolean>`exists(select 1 from ${schema.diasDeJogo} d where d.sala_id = ${idSala} and not d.encerrado)`,
    })
    .from(s)
    .where(ne(s.codigo, CODIGO_ADMIN))
    .orderBy(asc(s.codigo));
  const agora = Date.now();
  return linhas.map(({ criadoEm, bloqueadoAte, ...l }) => ({
    ...l,
    criadoEm: criadoEm.toISOString(),
    bloqueadaAte: bloqueadoAte && bloqueadoAte.getTime() > agora ? bloqueadoAte.toISOString() : null,
  }));
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
  const d = schema.diasDeJogo;
  // "podeDesfazer" vem na mesma consulta (antes era uma segunda ida ao banco).
  // Coluna qualificada à mão: numa consulta de uma tabela só o Drizzle escreve só "id".
  const idDia = sql.raw(`"dias_de_jogo"."id"`);
  const [dia] = await db()
    .select({
      id: d.id,
      data: d.data,
      estado: d.estado,
      versao: d.versao,
      encerrado: d.encerrado,
      podeDesfazer: sql<boolean>`exists(select 1 from ${schema.historicoEstado} h where h.dia_id = ${idDia})`,
    })
    .from(d)
    .where(and(eq(d.salaId, salaId), eq(d.encerrado, false)))
    .orderBy(desc(d.criadoEm))
    .limit(1);
  return dia ?? null;
}

/** Assiduidade de um jogador nos últimos dias de jogo encerrados da sala. */
export interface AssiduidadeDTO {
  /** Em quantos desses dias ele chegou. */
  dias: number;
  /** Posição do dia mais recente em que veio (0 = último dia de jogo). */
  ultimo: number;
}

/**
 * Quem mais veio nos últimos `limite` dias de jogo encerrados.
 * Lê só a lista de chegada de cada dia (não o estado inteiro).
 */
export async function assiduidade(salaId: string, limite = 20): Promise<Record<string, AssiduidadeDTO>> {
  const d = schema.diasDeJogo;
  const dias = await db()
    .select({ chegada: sql<string[] | null>`${d.estado}->'chegada'` })
    .from(d)
    .where(and(eq(d.salaId, salaId), eq(d.encerrado, true)))
    .orderBy(desc(d.data), desc(d.criadoEm))
    .limit(limite);
  const r: Record<string, AssiduidadeDTO> = {};
  dias.forEach(({ chegada }, i) => {
    for (const id of new Set(Array.isArray(chegada) ? chegada : [])) {
      const a = (r[id] ??= { dias: 0, ultimo: i });
      a.dias++;
    }
  });
  return r;
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

export interface DiaHistoricoDTO {
  id: string;
  data: string;
  encerrado: boolean;
  partidas: number;
}

/** Dias de jogo da sala, do mais recente para o mais antigo (só o resumo). */
export async function listarDiasHistorico(salaId: string, limite = 60): Promise<DiaHistoricoDTO[]> {
  const d = schema.diasDeJogo;
  return db()
    .select({
      id: d.id,
      data: d.data,
      encerrado: d.encerrado,
      partidas: sql<number>`coalesce(jsonb_array_length(${d.estado}->'historico'), 0)::int`,
    })
    .from(d)
    .where(eq(d.salaId, salaId))
    .orderBy(desc(d.data), desc(d.criadoEm))
    .limit(limite);
}

/** Estado completo de um dia da sala (para o histórico). */
export async function buscarDia(salaId: string, diaId: string): Promise<{ id: string; data: string; encerrado: boolean; estado: EstadoDia } | null> {
  const [dia] = await db()
    .select({
      id: schema.diasDeJogo.id,
      data: schema.diasDeJogo.data,
      encerrado: schema.diasDeJogo.encerrado,
      estado: schema.diasDeJogo.estado,
    })
    .from(schema.diasDeJogo)
    .where(and(eq(schema.diasDeJogo.id, diaId), eq(schema.diasDeJogo.salaId, salaId)))
    .limit(1);
  return dia ?? null;
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