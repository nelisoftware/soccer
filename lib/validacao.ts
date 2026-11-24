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

/** Id de cor gravado no time (precisa existir na sala; quem confere é a action). */
export const corSchema = z.string().regex(/^[a-z0-9-]{1,32}$/, "Cor inválida.");

export const corSalaSchema = z.object({
  id: corSchema,
  nome: z.string().trim().min(1, "Dê um nome para a cor.").max(20, "Nome da cor muito longo."),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida.").transform((h) => h.toLowerCase()),
});

const coresSalaSchema = z
  .array(corSalaSchema)
  .min(2, "Deixe pelo menos 2 cores.")
  .max(20, "No máximo 20 cores.")
  .refine((l) => new Set(l.map((c) => c.id)).size === l.length, "Cores repetidas.")
  .refine((l) => new Set(l.map((c) => c.nome.toLowerCase())).size === l.length, "Já existe uma cor com esse nome.");

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
  cores: coresSalaSchema,
});

export const jogadorSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome.").max(40),
  posicao: z.enum(["jogador", "goleiro"]),
  idoso: z.boolean(),
  mensalista: z.boolean(),
});

export const mesSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
