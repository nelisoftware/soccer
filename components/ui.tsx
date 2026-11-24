import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

type Variante = "primario" | "secundario" | "perigo" | "fantasma";

const VARIANTES: Record<Variante, string> = {
  primario: "bg-accent text-on-accent hover:bg-accent-strong",
  secundario: "bg-surface text-ink border border-line hover:bg-surface-2",
  perigo: "bg-danger-soft text-danger hover:brightness-95",
  fantasma: "text-ink hover:bg-surface-2",
};

export function Botao({
  variante = "secundario",
  tamanho = "md",
  className,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; tamanho?: "sm" | "md" | "lg" }) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition select-none",
        "disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-accent",
        tamanho === "sm" && "min-h-9 px-3 text-sm",
        tamanho === "md" && "min-h-11 px-4 text-[15px]",
        tamanho === "lg" && "min-h-13 px-5 text-base",
        VARIANTES[variante],
        className,
      )}
      {...p}
    />
  );
}

export function Cartao({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("rounded-2xl border border-line bg-surface", className)} {...p} />;
}

export function Selo({
  children,
  tom = "neutro",
  className,
}: {
  children: ReactNode;
  tom?: "neutro" | "acento" | "aviso" | "perigo";
  className?: string;
}) {
  const tons = {
    neutro: "bg-surface-2 text-muted",
    acento: "bg-accent-soft text-accent-strong",
    aviso: "bg-warn-soft text-warn",
    perigo: "bg-danger-soft text-danger",
  } as const;
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        tons[tom],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Titulo({ children, acao }: { children: ReactNode; acao?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{children}</h2>
      {acao}
    </div>
  );
}

export function Interruptor({
  ligado,
  onMudar,
  rotulo,
  descricao,
  desabilitado,
}: {
  ligado: boolean;
  onMudar: (v: boolean) => void;
  rotulo: string;
  descricao?: string;
  desabilitado?: boolean;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer">
      <span className="min-w-0">
        <span className="block text-[15px] font-medium">{rotulo}</span>
        {descricao && <span className="block text-sm text-muted">{descricao}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={ligado}
        aria-label={rotulo}
        disabled={desabilitado}
        onClick={() => onMudar(!ligado)}
        className={cx(
          "relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50",
          ligado ? "bg-accent" : "bg-line",
        )}
      >
        <span
          className={cx(
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
            ligado && "translate-x-5",
          )}
        />
      </button>
    </label>
  );
}

export const campoClasse =
  "w-full min-h-11 rounded-xl border border-line bg-surface px-3 text-base text-ink placeholder:text-muted focus:outline-2 focus:outline-accent";

export function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "R$ 15" quando não há centavos; senão "R$ 15,50". */
export function formatarReaisCurto(centavos: number): string {
  return centavos % 100 === 0 ? `R$ ${centavos / 100}` : formatarReais(centavos);
}
