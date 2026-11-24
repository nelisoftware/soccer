"use server";

import { and, eq, ne } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { CODIGO_ADMIN, SemPermissao, exigirAdmin, gerarHashPin, revogarAdmin } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { OK, type RespostaAcao } from "@/lib/resposta";
import { codigoSchema, idSchema, pinSchema } from "@/lib/validacao";

class ErroAdmin extends Error {}

async function executar(fn: () => Promise<void>): Promise<RespostaAcao> {
  try {
    await exigirAdmin();
    await fn();
    refresh();
    return OK;
  } catch (e) {
    if (e instanceof SemPermissao || e instanceof ErroAdmin) return { ok: false, erro: e.message };
    if (e instanceof z.ZodError) return { ok: false, erro: e.issues[0]?.message ?? "Dados inválidos." };
    console.error(e);
    return { ok: false, erro: "Erro inesperado. Tente novamente." };
  }
}

/** Filtro que nunca alcança a linha do próprio administrador. */
const salaComum = (id: string) => and(eq(schema.salas.id, id), ne(schema.salas.codigo, CODIGO_ADMIN));

async function exigirAfetada(linhas: unknown[]) {
  if (linhas.length === 0) throw new ErroAdmin("Sala não encontrada.");
}

/** Exclui a sala e tudo dela (jogadores, dias, financeiro) por cascata. */
export async function excluirSala(salaId: string): Promise<RespostaAcao> {
  return executar(async () => {
    const id = idSchema.parse(salaId);
    await exigirAfetada(await db().delete(schema.salas).where(salaComum(id)).returning({ id: schema.salas.id }));
  });
}

export async function renomearSala(salaId: string, novoCodigo: string): Promise<RespostaAcao> {
  return executar(async () => {
    const id = idSchema.parse(salaId);
    const codigo = codigoSchema.parse(novoCodigo);
    if (codigo === CODIGO_ADMIN) throw new ErroAdmin(`O código "${codigo}" é reservado.`);
    const [outra] = await db()
      .select({ id: schema.salas.id })
      .from(schema.salas)
      .where(and(eq(schema.salas.codigo, codigo), ne(schema.salas.id, id)))
      .limit(1);
    if (outra) throw new ErroAdmin(`Já existe uma sala "${codigo}".`);
    await exigirAfetada(
      await db().update(schema.salas).set({ codigo }).where(salaComum(id)).returning({ id: schema.salas.id }),
    );
  });
}

/** Define um novo PIN e libera o bloqueio por tentativas. */
export async function trocarPinSala(salaId: string, pin: string): Promise<RespostaAcao> {
  return executar(async () => {
    const id = idSchema.parse(salaId);
    const p = pinSchema.parse(pin);
    await exigirAfetada(
      await db()
        .update(schema.salas)
        .set({ pinHash: await gerarHashPin(p), tentativasFalhas: 0, bloqueadoAte: null })
        .where(salaComum(id))
        .returning({ id: schema.salas.id }),
    );
  });
}

export async function desbloquearSala(salaId: string): Promise<RespostaAcao> {
  return executar(async () => {
    const id = idSchema.parse(salaId);
    await exigirAfetada(
      await db()
        .update(schema.salas)
        .set({ tentativasFalhas: 0, bloqueadoAte: null })
        .where(salaComum(id))
        .returning({ id: schema.salas.id }),
    );
  });
}

export async function trocarPinAdmin(pin: string): Promise<RespostaAcao> {
  return executar(async () => {
    const p = pinSchema.parse(pin);
    await db()
      .update(schema.salas)
      .set({ pinHash: await gerarHashPin(p), tentativasFalhas: 0, bloqueadoAte: null })
      .where(eq(schema.salas.codigo, CODIGO_ADMIN));
  });
}

export async function sairAdmin(): Promise<void> {
  await revogarAdmin();
  redirect("/");
}
