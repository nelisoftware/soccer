import { Suspense } from "react";
import Link from "next/link";
import { buscarDia, listarDiasHistorico, listarJogadores } from "@/lib/dal";
import { carregarSala } from "@/lib/pagina";
import { idSchema } from "@/lib/validacao";
import { CabecalhoSala } from "@/components/CabecalhoSala";
import { Carregando } from "@/components/Carregando";
import { Cartao, cx } from "@/components/ui";
import { HistoricoDia } from "./HistoricoDia";

export default function PaginaHistorico({ params, searchParams }: PageProps<"/s/[codigo]/historico">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function rotuloData(iso: string, curto = false) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString(
    "pt-BR",
    curto ? { weekday: "short", day: "2-digit", month: "2-digit" } : { weekday: "long", day: "2-digit", month: "long", year: "numeric" },
  );
}

async function Conteudo({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sala, editavel } = await carregarSala(params);
  const [dias, jogadores, busca] = await Promise.all([
    listarDiasHistorico(sala.id),
    listarJogadores(sala.id, true),
    searchParams,
  ]);
  const pedido = idSchema.safeParse(busca.dia);
  const escolhido = dias.find((d) => pedido.success && d.id === pedido.data) ?? dias[0];
  const dia = escolhido ? await buscarDia(sala.id, escolhido.id) : null;
  const base = `/s/${encodeURIComponent(sala.codigo)}/historico`;

  return (
    <>
      <CabecalhoSala codigo={sala.codigo} titulo="Histórico" editavel={editavel} />

      {dias.length === 0 ? (
        <Cartao className="p-8 text-center text-muted">Nenhum dia de jogo registrado ainda.</Cartao>
      ) : (
        <>
          <nav aria-label="Dias de jogo" className="-mx-4 md:mx-0 px-4 md:px-0 mb-5 flex gap-2 overflow-x-auto pb-1">
            {dias.map((d) => {
              const ativo = d.id === escolhido?.id;
              return (
                <Link
                  key={d.id}
                  href={`${base}?dia=${d.id}`}
                  aria-current={ativo ? "page" : undefined}
                  className={cx(
                    "shrink-0 rounded-xl border px-3 py-2 text-sm transition",
                    ativo ? "border-accent bg-accent-soft text-accent-strong font-semibold" : "border-line bg-surface text-muted hover:bg-surface-2",
                  )}
                >
                  <span className="block capitalize">{rotuloData(d.data, true)}</span>
                  <span className="block text-xs">
                    {d.partidas} partida{d.partidas === 1 ? "" : "s"}
                    {!d.encerrado && " · em andamento"}
                  </span>
                </Link>
              );
            })}
          </nav>

          {dia && (
            <HistoricoDia
              titulo={rotuloData(dia.data)}
              emAndamento={!dia.encerrado}
              estado={dia.estado}
              nomes={Object.fromEntries(jogadores.map((j) => [j.id, j.nome]))}
              coresSala={sala.config.cores}
            />
          )}
        </>
      )}
    </>
  );
}
