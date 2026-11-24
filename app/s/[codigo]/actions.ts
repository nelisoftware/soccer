"use server";

import { and, desc, eq, notInArray } from "drizzle-orm";
import { refresh } from "next/cache";
import { z } from "zod";
import { SemPermissao, exigirEdicao } from "@/lib/auth";
import { buscarSala, listarJogadores, type SalaDTO } from "@/lib/dal";
import { db, schema } from "@/lib/db";
import * as motor from "@/lib/engine";
import { ErroRegra, type Contexto, type EstadoDia } from "@/lib/engine";
import { OK, type RespostaAcao } from "@/lib/resposta";
import { configSchema, idSchema, jogadorSchema, mesSchema } from "@/lib/validacao";

const MAX_HISTORICO = 20;

class ErroAcao extends Error {}

function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

/** Executa a ação tratando erros previsíveis como resposta, não como exceção. */
async function executar(fn: () => Promise<RespostaAcao | void>): Promise<RespostaAcao> {
  try {
    const r = await fn();
    refresh();
    return r ?? OK;
  } catch (e) {
    if (e instanceof ErroRegra || e instanceof SemPermissao || e instanceof ErroAcao) {
      return { ok: false, erro: e.message };
    }
    if (e instanceof z.ZodError) return { ok: false, erro: e.issues[0]?.message ?? "Dados inválidos." };
    console.error(e);
    return { ok: false, erro: "Erro inesperado. Tente novamente." };
  }
}

async function salaEditavel(codigo: string): Promise<SalaDTO> {
  const sala = await buscarSala(String(codigo));
  if (!sala) throw new ErroAcao("Sala não encontrada.");
  await exigirEdicao(sala.id);
  return sala;
}

async function contexto(sala: SalaDTO): Promise<Contexto> {
  const jogadores = await listarJogadores(sala.id, true);
  const mapa = new Map(jogadores.map((j) => [j.id, j]));
  return { config: sala.config, info: (id) => mapa.get(id), rng: Math.random, agora: Date.now() };
}

/**
 * Lê o dia, aplica a regra do motor e grava com checagem de versão
 * (controle otimista: se outra pessoa mexeu antes, devolve conflito).
 */
async function mutarDia(
  codigo: string,
  diaId: string,
  versao: number,
  descricao: string,
  regra: (estado: EstadoDia, ctx: Contexto) => EstadoDia,
): Promise<RespostaAcao> {
  return executar(async () => {
    const id = idSchema.parse(diaId);
    const v = z.number().int().min(0).parse(versao);
    const sala = await salaEditavel(codigo);
    const [dia] = await db()
      .select()
      .from(schema.diasDeJogo)
      .where(and(eq(schema.diasDeJogo.id, id), eq(schema.diasDeJogo.salaId, sala.id)))
      .limit(1);
    if (!dia || dia.encerrado) throw new ErroAcao("Dia de jogo não encontrado ou já encerrado.");
    if (dia.versao !== v) return { ok: false, erro: "A sala mudou enquanto você mexia. Confira e tente de novo.", conflito: true };

    const novo = regra(dia.estado, await contexto(sala));
    const atualizados = await db()
      .update(schema.diasDeJogo)
      .set({ estado: novo, versao: v + 1 })
      .where(and(eq(schema.diasDeJogo.id, id), eq(schema.diasDeJogo.versao, v)))
      .returning({ id: schema.diasDeJogo.id });
    if (atualizados.length === 0) {
      return { ok: false, erro: "A sala mudou enquanto você mexia. Confira e tente de novo.", conflito: true };
    }

    await db().insert(schema.historicoEstado).values({ diaId: id, estado: dia.estado, descricao });
    const recentes = await db()
      .select({ id: schema.historicoEstado.id })
      .from(schema.historicoEstado)
      .where(eq(schema.historicoEstado.diaId, id))
      .orderBy(desc(schema.historicoEstado.id))
      .limit(MAX_HISTORICO);
    if (recentes.length === MAX_HISTORICO) {
      await db()
        .delete(schema.historicoEstado)
        .where(
          and(
            eq(schema.historicoEstado.diaId, id),
            notInArray(
              schema.historicoEstado.id,
              recentes.map((r) => r.id),
            ),
          ),
        );
    }
  });
}

// ---------- Dia de jogo ----------

export async function iniciarDia(codigo: string): Promise<RespostaAcao> {
  return executar(async () => {
    const sala = await salaEditavel(codigo);
    const [aberto] = await db()
      .select({ id: schema.diasDeJogo.id })
      .from(schema.diasDeJogo)
      .where(and(eq(schema.diasDeJogo.salaId, sala.id), eq(schema.diasDeJogo.encerrado, false)))
      .limit(1);
    if (aberto) return;
    await db()
      .insert(schema.diasDeJogo)
      .values({ salaId: sala.id, data: hojeEmSaoPaulo(), estado: motor.estadoInicial() });
  });
}

export async function encerrarDia(codigo: string, diaId: string): Promise<RespostaAcao> {
  return executar(async () => {
    const sala = await salaEditavel(codigo);
    await db()
      .update(schema.diasDeJogo)
      .set({ encerrado: true })
      .where(and(eq(schema.diasDeJogo.id, idSchema.parse(diaId)), eq(schema.diasDeJogo.salaId, sala.id)));
    await db().delete(schema.historicoEstado).where(eq(schema.historicoEstado.diaId, diaId));
  });
}

export async function registrarChegada(codigo: string, diaId: string, versao: number, jogadorId: string) {
  return mutarDia(codigo, diaId, versao, "Chegada", (e, ctx) =>
    motor.registrarChegada(e, idSchema.parse(jogadorId), ctx),
  );
}

export async function cadastrarEChegar(
  codigo: string,
  diaId: string,
  versao: number,
  dados: z.input<typeof jogadorSchema>,
): Promise<RespostaAcao> {
  const parsed = jogadorSchema.safeParse(dados);
  if (!parsed.success) return { ok: false, erro: parsed.error.issues[0].message };
  let novoId: string | null = null;
  const criar = await executar(async () => {
    const sala = await salaEditavel(codigo);
    const [j] = await db()
      .insert(schema.jogadores)
      .values({ salaId: sala.id, ...parsed.data })
      .returning({ id: schema.jogadores.id });
    novoId = j.id;
  });
  if (!criar.ok || !novoId) return criar;
  const id: string = novoId;
  return mutarDia(codigo, diaId, versao, "Chegada", (e, ctx) => motor.registrarChegada(e, id, ctx));
}

export async function removerDaFila(codigo: string, diaId: string, versao: number, jogadorId: string) {
  return mutarDia(codigo, diaId, versao, "Saiu da fila", (e) => motor.removerDaFila(e, idSchema.parse(jogadorId)));
}

export async function moverNaFila(codigo: string, diaId: string, versao: number, jogadorId: string, delta: -1 | 1) {
  return mutarDia(codigo, diaId, versao, "Ordem da fila", (e) =>
    motor.moverNaFila(e, idSchema.parse(jogadorId), z.union([z.literal(-1), z.literal(1)]).parse(delta)),
  );
}

export async function sortearTimes(codigo: string, diaId: string, versao: number) {
  return mutarDia(codigo, diaId, versao, "Sorteio", (e, ctx) => motor.sortearTimes(e, ctx));
}

export async function substituir(codigo: string, diaId: string, versao: number, jogadorId: string, volta: boolean) {
  return mutarDia(codigo, diaId, versao, "Substituição", (e, ctx) =>
    motor.substituir(e, idSchema.parse(jogadorId), z.boolean().parse(volta), ctx),
  );
}

export async function controlarCronometro(
  codigo: string,
  diaId: string,
  versao: number,
  comando: "iniciar" | "pausar" | "zerar",
) {
  return mutarDia(codigo, diaId, versao, "Cronômetro", (e, ctx) => {
    const c = z.enum(["iniciar", "pausar", "zerar"]).parse(comando);
    return c === "iniciar" ? motor.iniciarCronometro(e, ctx) : c === "pausar" ? motor.pausarCronometro(e, ctx) : motor.zerarCronometro(e);
  });
}

export async function marcarGol(codigo: string, diaId: string, versao: number, time: 0 | 1, delta: 1 | -1) {
  return mutarDia(codigo, diaId, versao, "Gol", (e) =>
    motor.marcarGol(
      e,
      z.union([z.literal(0), z.literal(1)]).parse(time),
      z.union([z.literal(-1), z.literal(1)]).parse(delta),
    ),
  );
}

export async function finalizarPartida(codigo: string, diaId: string, versao: number, resultado: 0 | 1 | "empate") {
  return mutarDia(codigo, diaId, versao, "Fim de partida", (e, ctx) =>
    motor.finalizarPartida(e, z.union([z.literal(0), z.literal(1), z.literal("empate")]).parse(resultado), ctx),
  );
}

export async function desfazer(codigo: string, diaId: string, versao: number): Promise<RespostaAcao> {
  return executar(async () => {
    const id = idSchema.parse(diaId);
    const sala = await salaEditavel(codigo);
    const [dia] = await db()
      .select({ versao: schema.diasDeJogo.versao, encerrado: schema.diasDeJogo.encerrado })
      .from(schema.diasDeJogo)
      .where(and(eq(schema.diasDeJogo.id, id), eq(schema.diasDeJogo.salaId, sala.id)))
      .limit(1);
    if (!dia || dia.encerrado) throw new ErroAcao("Dia de jogo não encontrado ou já encerrado.");
    if (dia.versao !== versao) return { ok: false, erro: "A sala mudou. Confira antes de desfazer.", conflito: true };

    const [ultimo] = await db()
      .select()
      .from(schema.historicoEstado)
      .where(eq(schema.historicoEstado.diaId, id))
      .orderBy(desc(schema.historicoEstado.id))
      .limit(1);
    if (!ultimo) throw new ErroAcao("Nada para desfazer.");

    const ok = await db()
      .update(schema.diasDeJogo)
      .set({ estado: ultimo.estado, versao: versao + 1 })
      .where(and(eq(schema.diasDeJogo.id, id), eq(schema.diasDeJogo.versao, versao)))
      .returning({ id: schema.diasDeJogo.id });
    if (ok.length === 0) return { ok: false, erro: "A sala mudou. Confira antes de desfazer.", conflito: true };
    await db().delete(schema.historicoEstado).where(eq(schema.historicoEstado.id, ultimo.id));
  });
}

// ---------- Cadastro e configurações ----------

export async function salvarJogador(
  codigo: string,
  jogadorId: string | null,
  dados: z.input<typeof jogadorSchema>,
): Promise<RespostaAcao> {
  return executar(async () => {
    const sala = await salaEditavel(codigo);
    const d = jogadorSchema.parse(dados);
    if (jogadorId === null) {
      await db().insert(schema.jogadores).values({ salaId: sala.id, ...d });
    } else {
      await db()
        .update(schema.jogadores)
        .set(d)
        .where(and(eq(schema.jogadores.id, idSchema.parse(jogadorId)), eq(schema.jogadores.salaId, sala.id)));
    }
  });
}

export async function definirAtivo(codigo: string, jogadorId: string, ativo: boolean): Promise<RespostaAcao> {
  return executar(async () => {
    const sala = await salaEditavel(codigo);
    await db()
      .update(schema.jogadores)
      .set({ ativo: z.boolean().parse(ativo) })
      .where(and(eq(schema.jogadores.id, idSchema.parse(jogadorId)), eq(schema.jogadores.salaId, sala.id)));
  });
}

export async function salvarConfig(codigo: string, config: z.input<typeof configSchema>): Promise<RespostaAcao> {
  return executar(async () => {
    const sala = await salaEditavel(codigo);
    await db().update(schema.salas).set({ config: configSchema.parse(config) }).where(eq(schema.salas.id, sala.id));
  });
}

// ---------- Financeiro ----------

export async function marcarMensalidade(
  codigo: string,
  jogadorId: string,
  mes: string,
  pago: boolean,
): Promise<RespostaAcao> {
  return executar(async () => {
    const sala = await salaEditavel(codigo);
    const jid = idSchema.parse(jogadorId);
    const m = mesSchema.parse(mes);
    const [jogador] = await db()
      .select({ id: schema.jogadores.id })
      .from(schema.jogadores)
      .where(and(eq(schema.jogadores.id, jid), eq(schema.jogadores.salaId, sala.id)))
      .limit(1);
    if (!jogador) throw new ErroAcao("Jogador não encontrado.");
    if (pago) {
      await db()
        .insert(schema.mensalidades)
        .values({ salaId: sala.id, jogadorId: jid, mes: m, valor: sala.config.valorMensalidade })
        .onConflictDoNothing();
    } else {
      await db()
        .delete(schema.mensalidades)
        .where(and(eq(schema.mensalidades.jogadorId, jid), eq(schema.mensalidades.mes, m)));
    }
  });
}

export async function marcarAvulso(
  codigo: string,
  diaId: string,
  jogadorId: string,
  pago: boolean,
): Promise<RespostaAcao> {
  return executar(async () => {
    const sala = await salaEditavel(codigo);
    const did = idSchema.parse(diaId);
    const jid = idSchema.parse(jogadorId);
    const [dia] = await db()
      .select({ id: schema.diasDeJogo.id })
      .from(schema.diasDeJogo)
      .where(and(eq(schema.diasDeJogo.id, did), eq(schema.diasDeJogo.salaId, sala.id)))
      .limit(1);
    if (!dia) throw new ErroAcao("Dia de jogo não encontrado.");
    if (pago) {
      await db()
        .insert(schema.avulsos)
        .values({ diaId: did, jogadorId: jid, valor: sala.config.valorAvulso })
        .onConflictDoNothing();
    } else {
      await db().delete(schema.avulsos).where(and(eq(schema.avulsos.diaId, did), eq(schema.avulsos.jogadorId, jid)));
    }
  });
}
