export type RespostaAcao = { ok: true } | { ok: false; erro: string; conflito?: boolean };

export const OK: RespostaAcao = { ok: true };
