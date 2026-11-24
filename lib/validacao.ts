import { z } from "zod";

export const REGEX_CODIGO = /^[a-z0-9][a-z0-9._-]{2,31}$/;

export function normalizarCodigo(codigo: string): string {
  return codigo.trim().toLowerCase();
}

export const codigoSchema = z
  .string()
  .transform(normalizarCodigo)
  .pipe(
    z
      .string()
      .regex(REGEX_CODIGO, "Use 3 a 32 caracteres: letras, números, ponto, hífen ou _ (ex.: bola23.11)."),
  );

export const pinSchema = z.string().regex(/^\d{4}$/, "O PIN deve ter 4 dígitos.");

export const idSchema = z.uuid();

export const configSchema = z.object({
  jogadoresPorTime: z.coerce.number().int().min(2).max(11),
  goleiroNaLista: z.boolean(),
  permiteMaisDeUmIdoso: z.boolean(),
  regraEmpate: z.enum(["saemOsDois", "saiMaisAntigo"]),
  maxVitoriasSeguidas: z.coerce.number().int().min(0).max(20),
  minutosPorPartida: z.coerce.number().int().min(1).max(90),
  golsParaEncerrar: z.coerce.number().int().min(0).max(20),
  valorAvulso: z.coerce.number().int().min(0).max(1_000_000),
  valorMensalidade: z.coerce.number().int().min(0).max(1_000_000),
});

export const jogadorSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome.").max(40),
  posicao: z.enum(["jogador", "goleiro"]),
  idoso: z.boolean(),
  mensalista: z.boolean(),
});

export const mesSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
