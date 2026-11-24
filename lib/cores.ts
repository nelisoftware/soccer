import type { CSSProperties } from "react";
import type { TimeEmQuadra } from "./engine/types";

/** Uma cor de colete da sala. `id` é o que fica gravado no time e no histórico. */
export interface CorSala {
  id: string;
  nome: string;
  /** #rrggbb: a cor real do colete. */
  hex: string;
}

/** Id de cor como fica gravado no estado do dia. */
export type CorTime = string;

/** Sugestões para adicionar na sala (e para reconhecer ids antigos). */
export const CORES_SUGERIDAS: CorSala[] = [
  { id: "preto", nome: "Preto", hex: "#1f2421" },
  { id: "azul", nome: "Azul", hex: "#1f6fd1" },
  { id: "amarelo", nome: "Amarelo", hex: "#f2c230" },
  { id: "branco", nome: "Branco", hex: "#ffffff" },
  { id: "vermelho", nome: "Vermelho", hex: "#d63a2f" },
  { id: "verde", nome: "Verde", hex: "#1f9d4c" },
  { id: "laranja", nome: "Laranja", hex: "#f07c22" },
  { id: "roxo", nome: "Roxo", hex: "#7b3fc4" },
  { id: "rosa", nome: "Rosa", hex: "#e0458f" },
  { id: "cinza", nome: "Cinza", hex: "#8a948d" },
  { id: "vinho", nome: "Vinho", hex: "#7a1f35" },
  { id: "azul-claro", nome: "Azul-claro", hex: "#3db4f2" },
  { id: "verde-limao", nome: "Verde-limão", hex: "#a3d12e" },
];

const sugerida = (id: string) => CORES_SUGERIDAS.find((c) => c.id === id)!;

/** Cores com que toda sala começa. */
export const CORES_INICIAIS: CorSala[] = ["preto", "azul", "amarelo", "branco"].map(sugerida);

/** Acha a cor pelo id: primeiro na sala, depois nas sugestões (ids antigos), senão um cinza genérico. */
export function resolverCor(id: CorTime, coresSala: CorSala[]): CorSala {
  return (
    coresSala.find((c) => c.id === id) ??
    CORES_SUGERIDAS.find((c) => c.id === id) ?? { id, nome: id, hex: "#8a948d" }
  );
}

/** Cor do time; sem cor gravada (sorteio antigo), usa a 1ª/2ª cor da sala. */
export function corDoTime(time: Pick<TimeEmQuadra, "cor"> | undefined, lado: number, coresSala: CorSala[]): CorTime {
  return time?.cor ?? coresSala[lado === 0 ? 0 : 1]?.id ?? (lado === 0 ? "preto" : "azul");
}

export function nomeTime(cor: CorSala): string {
  return `Time ${cor.nome}`;
}

/** Id novo e legível a partir do nome ("Verde Limão" → "verde-limao"). */
export function idDaCor(nome: string, existentes: string[]): string {
  const base =
    nome
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 24) || "cor";
  let id = base;
  for (let n = 2; existentes.includes(id); n++) id = `${base}-${n}`;
  return id;
}

// ---------- Tons derivados do hex (claro/escuro, fundo suave, texto sobre a cor) ----------

const SUPERFICIE_CLARA = "#ffffff";
const SUPERFICIE_ESCURA = "#171e19";

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function paraHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Mistura `a` com `b` (t = 0 → a, t = 1 → b). */
function misturar(a: string, b: string, t: number): string {
  const [x, y] = [rgb(a), rgb(b)];
  return paraHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as [number, number, number]);
}

function luminancia(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Escurece (ou clareia) até a cor ser legível sobre a superfície (texto, borda, botão). */
function legivelSobre(hex: string, superficie: string, rumo: string): string {
  let c = hex;
  for (let t = 0.1; contraste(c, superficie) < 3 && t <= 1; t += 0.1) c = misturar(hex, rumo, t);
  return c;
}

function textoSobre(fundo: string): string {
  return contraste(fundo, "#ffffff") >= contraste(fundo, "#111511") ? "#ffffff" : "#111511";
}

interface Tons {
  claro: string;
  escuro: string;
  suaveClaro: string;
  suaveEscuro: string;
}

const cacheTons = new Map<string, Tons>();

function tons(hex: string): Tons {
  let t = cacheTons.get(hex);
  if (!t) {
    const claro = legivelSobre(hex, SUPERFICIE_CLARA, "#000000");
    const escuro = legivelSobre(hex, SUPERFICIE_ESCURA, "#ffffff");
    t = {
      claro,
      escuro,
      suaveClaro: misturar(claro, SUPERFICIE_CLARA, 0.86),
      suaveEscuro: misturar(escuro, SUPERFICIE_ESCURA, 0.8),
    };
    cacheTons.set(hex, t);
  }
  return t;
}

/**
 * Variáveis CSS para as classes text-team-a, bg-team-a, bg-team-a-soft, text-team-a-on e
 * bg-team-a-tinta (a cor real, para bolinhas). light-dark() segue o color-scheme da página.
 */
export function varsCor(cor: CorSala, slot: "a" | "b" = "a"): CSSProperties {
  const t = tons(cor.hex);
  return {
    [`--team-${slot}`]: `light-dark(${t.claro}, ${t.escuro})`,
    [`--team-${slot}-soft`]: `light-dark(${t.suaveClaro}, ${t.suaveEscuro})`,
    [`--team-${slot}-on`]: `light-dark(${textoSobre(t.claro)}, ${textoSobre(t.escuro)})`,
    [`--team-${slot}-tinta`]: cor.hex,
  } as CSSProperties;
}

/** Aplica as cores dos 2 times (slot a = lado 1, b = lado 2) a um bloco. */
export function estiloTimes(cores: [CorSala, CorSala]): CSSProperties {
  return { ...varsCor(cores[0], "a"), ...varsCor(cores[1], "b") };
}
