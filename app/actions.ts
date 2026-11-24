"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { concederEdicao, conferirPin, gerarHashPin, revogarEdicao } from "@/lib/auth";
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
  const [sala] = await db().select().from(schema.salas).where(eq(schema.salas.codigo, codigo.data)).limit(1);
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
  await concederEdicao(sala.id);
  redirect(`/s/${encodeURIComponent(sala.codigo)}`);
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
