"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import {
  CODIGO_ADMIN,
  concederAdmin,
  concederEdicao,
  conferirPin,
  gerarHashPin,
  revogarEdicao,
} from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { CONFIG_PADRAO } from "@/lib/engine/types";
import { codigoSchema, pinSchema } from "@/lib/validacao";

export interface EstadoFormSala {
  erro?: string;
  codigo?: string;
}

const formSala = z.object({ codigo: codigoSchema, pin: pinSchema });

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 5 * 60 * 1000;

export async function criarSala(_: EstadoFormSala, formData: FormData): Promise<EstadoFormSala> {
  const dados = formSala.safeParse({ codigo: formData.get("codigo"), pin: formData.get("pin") });
  const codigoDigitado = String(formData.get("codigo") ?? "");
  if (!dados.success) return { erro: dados.error.issues[0].message, codigo: codigoDigitado };

  const { codigo, pin } = dados.data;
  if (codigo === CODIGO_ADMIN) return { erro: `O código "${codigo}" é reservado. Escolha outro.`, codigo: codigoDigitado };
  const [criada] = await db()
    .insert(schema.salas)
    .values({ codigo, pinHash: await gerarHashPin(pin), config: CONFIG_PADRAO })
    .onConflictDoNothing({ target: schema.salas.codigo })
    .returning({ id: schema.salas.id });
  if (!criada) return { erro: `A sala "${codigo}" já existe. Escolha outro código.`, codigo: codigoDigitado };

  await concederEdicao(criada.id);
  redirect(`/s/${encodeURIComponent(codigo)}/config`);
}

export async function entrarSala(_: EstadoFormSala, formData: FormData): Promise<EstadoFormSala> {
  const codigoDigitado = String(formData.get("codigo") ?? "");
  const codigo = codigoSchema.safeParse(formData.get("codigo"));
  if (!codigo.success) return { erro: codigo.error.issues[0].message, codigo: codigoDigitado };

  const pinTxt = String(formData.get("pin") ?? "");
  const admin = codigo.data === CODIGO_ADMIN;
  if (admin && pinTxt === "") return { erro: "Digite o PIN do administrador.", codigo: codigoDigitado };

  const sala = admin ? await linhaAdmin() : await linhaSala(codigo.data);
  if (!sala) return { erro: "Sala não encontrada.", codigo: codigoDigitado };

  // Sem PIN: entra só para ver.
  if (pinTxt === "") redirect(`/s/${encodeURIComponent(sala.codigo)}`);

  if (sala.bloqueadoAte && sala.bloqueadoAte.getTime() > Date.now()) {
    return { erro: "Muitas tentativas erradas. Tente de novo em alguns minutos.", codigo: codigoDigitado };
  }

  const pin = pinSchema.safeParse(pinTxt);
  const correto = pin.success && (await conferirPin(pin.data, sala.pinHash));
  if (!correto) {
    const tentativas = sala.tentativasFalhas + 1;
    const bloquear = tentativas >= MAX_TENTATIVAS;
    await db()
      .update(schema.salas)
      .set({
        tentativasFalhas: bloquear ? 0 : tentativas,
        bloqueadoAte: bloquear ? new Date(Date.now() + BLOQUEIO_MS) : sala.bloqueadoAte,
      })
      .where(eq(schema.salas.id, sala.id));
    return { erro: "PIN incorreto.", codigo: codigoDigitado };
  }

  if (sala.tentativasFalhas > 0) {
    await db().update(schema.salas).set({ tentativasFalhas: 0 }).where(eq(schema.salas.id, sala.id));
  }
  if (admin) {
    await concederAdmin();
    redirect("/admin");
  }
  await concederEdicao(sala.id);
  redirect(`/s/${encodeURIComponent(sala.codigo)}`);
}

async function linhaSala(codigo: string) {
  const [sala] = await db().select().from(schema.salas).where(eq(schema.salas.codigo, codigo)).limit(1);
  return sala;
}

/**
 * Linha do administrador (guarda o PIN e o bloqueio por tentativas).
 * Criada no primeiro login a partir de ADMIN_PIN; depois o PIN é trocado pelo painel.
 */
async function linhaAdmin() {
  const existente = await linhaSala(CODIGO_ADMIN);
  if (existente) return existente;
  const pin = pinSchema.safeParse(process.env.ADMIN_PIN ?? "");
  if (!pin.success) throw new Error("ADMIN_PIN não configurado (4 dígitos).");
  await db()
    .insert(schema.salas)
    .values({ codigo: CODIGO_ADMIN, pinHash: await gerarHashPin(pin.data), config: CONFIG_PADRAO })
    .onConflictDoNothing({ target: schema.salas.codigo });
  return linhaSala(CODIGO_ADMIN);
}

export async function sairDaSala(codigo: string): Promise<void> {
  const c = codigoSchema.safeParse(codigo);
  if (!c.success) return;
  const [sala] = await db()
    .select({ id: schema.salas.id })
    .from(schema.salas)
    .where(eq(schema.salas.codigo, c.data))
    .limit(1);
  if (sala) await revogarEdicao(sala.id);
  redirect("/");
}
