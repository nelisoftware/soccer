import Link from "next/link";
import type { ReactNode } from "react";
import { IconeCadeado } from "./icones";

export function CabecalhoSala({
  codigo,
  titulo,
  editavel,
  acoes,
}: {
  codigo: string;
  titulo: string;
  editavel: boolean;
  acoes?: ReactNode;
}) {
  return (
    <header className="mb-4 md:mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="min-w-0 basis-full md:basis-0 md:flex-1">
        <p className="text-sm text-muted truncate">
          Sala <span className="font-semibold text-ink">{codigo}</span>
        </p>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{titulo}</h1>
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
