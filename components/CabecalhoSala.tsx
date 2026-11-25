import Link from "next/link";
import type { ReactNode } from "react";
import { IconeCadeado } from "./icones";
import { cx } from "./ui";

export function CabecalhoSala({
  codigo,
  titulo,
  tituloCurto,
  editavel,
  acoes,
}: {
  codigo: string;
  titulo: string;
  /**
   * Versão curta do título para o celular: aparece na mesma linha do nome da sala
   * ("Sala max · 25/11") e as ações sobem para essa linha, poupando espaço vertical.
   */
  tituloCurto?: string;
  editavel: boolean;
  acoes?: ReactNode;
}) {
  return (
    <header className="mb-3 md:mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className={cx("min-w-0 md:basis-0 md:flex-1", tituloCurto ? "flex-1" : "basis-full")}>
        <p className={cx("text-muted truncate", tituloCurto ? "text-base md:text-sm" : "text-sm")}>
          Sala <span className="font-semibold text-ink">{codigo}</span>
          {tituloCurto && (
            <span className="md:hidden">
              {" · "}
              <span className="font-bold text-ink">{tituloCurto}</span>
            </span>
          )}
        </p>
        <h1
          className={cx(
            "text-2xl md:text-3xl font-bold tracking-tight",
            tituloCurto && "sr-only md:not-sr-only",
          )}
        >
          {titulo}
        </h1>
      </div>
      {editavel ? (
        acoes
      ) : (
        <Link
          href={`/?codigo=${encodeURIComponent(codigo)}`}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 min-h-11 text-sm font-medium"
        >
          <IconeCadeado width={18} height={18} />
          Só leitura · Entrar com PIN
        </Link>
      )}
    </header>
  );
}
