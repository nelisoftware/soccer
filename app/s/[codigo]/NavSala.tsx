"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  IconeBola,
  IconeCampo,
  IconeConfig,
  IconeDinheiro,
  IconeHistorico,
  IconePessoas,
} from "@/components/icones";
import { cx } from "@/components/ui";

const ITENS = [
  { rota: "", rotulo: "Jogo", Icone: IconeCampo },
  { rota: "/historico", rotulo: "Histórico", Icone: IconeHistorico },
  { rota: "/jogadores", rotulo: "Jogadores", Icone: IconePessoas },
  { rota: "/financeiro", rotulo: "Financeiro", Icone: IconeDinheiro },
  { rota: "/config", rotulo: "Config", Icone: IconeConfig },
] as const;

export function NavSala() {
  const { codigo } = useParams<{ codigo: string }>();
  const pathname = usePathname();
  const base = `/s/${codigo}`;
  const ativo = (rota: string) => {
    const alvo = decodeURIComponent(base + rota);
    const atual = decodeURIComponent(pathname);
    return rota === "" ? atual === alvo : atual.startsWith(alvo);
  };

  return (
    <>
      {/* Laptop/Desktop: menu lateral */}
      <nav className="hidden xl:flex fixed inset-y-0 left-0 w-60 flex-col border-r border-line bg-surface px-4 py-6">
        <Link href="/" className="flex items-center gap-2.5 px-2 mb-8">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-on-accent">
            <IconeBola width={22} height={22} />
          </span>
          <span className="text-lg font-bold">Pelada</span>
        </Link>
        <ul className="space-y-1">
          {ITENS.map(({ rota, rotulo, Icone }) => (
            <li key={rota}>
              <Link
                href={base + rota}
                aria-current={ativo(rota) ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-xl px-3 min-h-11 font-medium transition",
                  ativo(rota) ? "bg-accent-soft text-accent-strong" : "text-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                <Icone />
                {rotulo}
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-auto px-2 text-sm text-muted break-all">
          Sala <span className="font-semibold text-ink">{decodeURIComponent(codigo)}</span>
        </p>
      </nav>

      {/* Mobile/Tablet: abas fixas embaixo */}
      <nav className="xl:hidden fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-5 max-w-2xl mx-auto">
          {ITENS.map(({ rota, rotulo, Icone }) => (
            <li key={rota}>
              <Link
                href={base + rota}
                aria-current={ativo(rota) ? "page" : undefined}
                className={cx(
                  "flex flex-col items-center justify-center gap-0.5 h-16 text-xs font-medium transition",
                  ativo(rota) ? "text-accent" : "text-muted",
                )}
              >
                <Icone width={22} height={22} />
                {rotulo}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
