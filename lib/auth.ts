import "server-only";
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

const scrypt = promisify(scryptCb) as (senha: string, salt: Buffer, tamanho: number) => Promise<Buffer>;
const DURACAO_SESSAO_S = 60 * 60 * 24 * 30; // 30 dias

function segredo(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 16) throw new Error("SESSION_SECRET não configurado (mínimo 16 caracteres).");
  return s;
}

export async function gerarHashPin(pin: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pin, salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function conferirPin(pin: string, guardado: string): Promise<boolean> {
  const [saltHex, hashHex] = guardado.split(":");
  if (!saltHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, "hex");
  const calculado = await scrypt(pin, Buffer.from(saltHex, "hex"), esperado.length);
  return timingSafeEqual(esperado, calculado);
}

const nomeCookie = (salaId: string) => `sala_${salaId}`;

function assinar(salaId: string, expira: number): string {
  return createHmac("sha256", segredo()).update(`${salaId}.${expira}`).digest("base64url");
}

/** Libera a edição da sala neste aparelho (cookie httpOnly assinado). */
export async function concederEdicao(salaId: string): Promise<void> {
  const expira = Math.floor(Date.now() / 1000) + DURACAO_SESSAO_S;
  (await cookies()).set(nomeCookie(salaId), `${expira}.${assinar(salaId, expira)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DURACAO_SESSAO_S,
  });
}

export async function revogarEdicao(salaId: string): Promise<void> {
  (await cookies()).delete(nomeCookie(salaId));
}

export async function podeEditar(salaId: string): Promise<boolean> {
  const valor = (await cookies()).get(nomeCookie(salaId))?.value;
  if (!valor) return false;
  const [expiraTxt, assinatura] = valor.split(".");
  const expira = Number(expiraTxt);
  if (!Number.isFinite(expira) || !assinatura || expira * 1000 < Date.now()) return false;
  const esperado = Buffer.from(assinar(salaId, expira));
  const recebido = Buffer.from(assinatura);
  return esperado.length === recebido.length && timingSafeEqual(esperado, recebido);
}

export class SemPermissao extends Error {
  constructor() {
    super("Digite o PIN da sala para editar.");
    this.name = "SemPermissao";
  }
}

export async function exigirEdicao(salaId: string): Promise<void> {
  if (!(await podeEditar(salaId))) throw new SemPermissao();
}
