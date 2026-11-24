"use client";

import Link from "next/link";
import type { JogadorDTO } from "@/lib/dal";
import type { ConfigSala } from "@/lib/engine";
import { CabecalhoSala } from "@/components/CabecalhoSala";
import { IconeBaixo, IconeCheck } from "@/components/icones";
import { Aviso, useAcao } from "@/components/useAcao";
import { Cartao, Selo, Titulo, cx, formatarReais } from "@/components/ui";
import { SelosJogador } from "../jogo/LinhaJogador";
import * as acoes from "../actions";

export interface ItemPagamento {
  jogadorId: string;
  valorPago: number | null;
}

export interface DiaAvulsos {
  id: string;
  data: string;
  encerrado: boolean;
  itens: ItemPagamento[];
}

function deslocarMes(mes: string, delta: number): string {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(a, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nomeMes(mes: string): string {
  const [a, m] = mes.split("-").map(Number);
  const txt = new Date(a, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
}

function dataCurta(iso: string): string {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
}

function Linha({
  j,
  item,
  valorPadrao,
  desabilitado,
  onAlternar,
}: {
  j?: JogadorDTO;
  item: ItemPagamento;
  valorPadrao: number;
  desabilitado: boolean;
  onAlternar: () => void;
}) {
  const pago = item.valorPago !== null;
  return (
    <li className="flex items-center gap-2 min-h-12 px-3">
      <span className="min-w-0 flex-1 flex items-center gap-1.5">
        <span className="truncate font-medium">{j?.nome ?? "?"}</span>
        <SelosJogador j={j} />
      </span>
      <button
        type="button"
        disabled={desabilitado}
        onClick={onAlternar}
        aria-pressed={pago}
        className={cx(
          "inline-flex items-center gap-1 rounded-lg px-2.5 min-h-9 text-sm font-semibold transition disabled:cursor-default",
          pago ? "bg-accent-soft text-accent-strong" : "bg-danger-soft text-danger",
        )}
      >
        {pago && <IconeCheck width={14} height={14} />}
        {pago ? formatarReais(item.valorPago!) : `Pendente · ${formatarReais(valorPadrao)}`}
      </button>
    </li>
  );
}

export function PainelFinanceiro({
  codigo,
  editavel,
  mes,
  config,
  jogadores,
  mensalistas,
  dias,
}: {
  codigo: string;
  editavel: boolean;
  mes: string;
  config: ConfigSala;
  jogadores: JogadorDTO[];
  mensalistas: ItemPagamento[];
  dias: DiaAvulsos[];
}) {
  const { executar, pendente, erro, limparErro } = useAcao();
  const porId = new Map(jogadores.map((j) => [j.id, j]));
  const nomeDe = (id: string) => porId.get(id)?.nome ?? "";
  const ordenar = (itens: ItemPagamento[]) => [...itens].sort((a, b) => nomeDe(a.jogadorId).localeCompare(nomeDe(b.jogadorId)));

  const totalMensal = mensalistas.reduce((s, i) => s + (i.valorPago ?? 0), 0);
  const pendMensal = mensalistas.filter((i) => i.valorPago === null).length;
  const itensAvulsos = dias.flatMap((d) => d.itens);
  const totalAvulso = itensAvulsos.reduce((s, i) => s + (i.valorPago ?? 0), 0);
  const pendAvulso = itensAvulsos.filter((i) => i.valorPago === null).length;

  const base = `/s/${encodeURIComponent(codigo)}/financeiro`;
  const navMes = (
    <div className="flex items-center gap-1">
      <Link
        href={`${base}?mes=${deslocarMes(mes, -1)}`}
        aria-label="Mês anterior"
        className="h-11 w-11 inline-flex items-center justify-center rounded-xl border border-line bg-surface"
      >
        <IconeBaixo className="rotate-90" />
      </Link>
      <span className="min-w-36 text-center font-semibold">{nomeMes(mes)}</span>
      <Link
        href={`${base}?mes=${deslocarMes(mes, 1)}`}
        aria-label="Próximo mês"
        className="h-11 w-11 inline-flex items-center justify-center rounded-xl border border-line bg-surface"
      >
        <IconeBaixo className="-rotate-90" />
      </Link>
    </div>
  );

  return (
    <>
      <CabecalhoSala codigo={codigo} titulo="Financeiro" editavel={editavel} acoes={navMes} />
      {!editavel && <div className="mb-4">{navMes}</div>}

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
        <Cartao className="p-4">
          <p className="text-sm text-muted">Mensalidades</p>
          <p className="tabular text-xl md:text-2xl font-bold">{formatarReais(totalMensal)}</p>
          <p className="text-xs text-muted">{pendMensal} pendente(s)</p>
        </Cartao>
        <Cartao className="p-4">
          <p className="text-sm text-muted">Avulsos</p>
          <p className="tabular text-xl md:text-2xl font-bold">{formatarReais(totalAvulso)}</p>
          <p className="text-xs text-muted">{pendAvulso} pendente(s)</p>
        </Cartao>
        <div className="rounded-2xl p-4 col-span-2 xl:col-span-1 bg-accent-soft">
          <p className="text-sm text-accent-strong">Total recebido no mês</p>
          <p className="tabular text-2xl md:text-3xl font-bold text-accent-strong">{formatarReais(totalMensal + totalAvulso)}</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <section>
          <Titulo>Mensalistas · {formatarReais(config.valorMensalidade)}</Titulo>
          <Cartao className="overflow-hidden">
            {mensalistas.length === 0 ? (
              <p className="p-4 text-sm text-muted">Nenhum mensalista. Marque jogadores como mensalistas na aba Jogadores.</p>
            ) : (
              <ul className="divide-y divide-line">
                {ordenar(mensalistas).map((item) => (
                  <Linha
                    key={item.jogadorId}
                    j={porId.get(item.jogadorId)}
                    item={item}
                    valorPadrao={config.valorMensalidade}
                    desabilitado={!editavel || pendente}
                    onAlternar={() =>
                      executar(() => acoes.marcarMensalidade(codigo, item.jogadorId, mes, item.valorPago === null))
                    }
                  />
                ))}
              </ul>
            )}
          </Cartao>
        </section>

        <section>
          <Titulo>Avulsos por dia · {formatarReais(config.valorAvulso)}</Titulo>
          {dias.length === 0 ? (
            <Cartao className="p-4 text-sm text-muted">Nenhum dia de jogo neste mês.</Cartao>
          ) : (
            <div className="grid gap-3">
              {dias.map((d) => (
                <Cartao key={d.id} className="overflow-hidden">
                  <div className="px-3 py-2 border-b border-line flex items-center justify-between">
                    <span className="font-semibold capitalize">{dataCurta(d.data)}</span>
                    {!d.encerrado && <Selo tom="acento">Hoje</Selo>}
                  </div>
                  {d.itens.length === 0 ? (
                    <p className="p-3 text-sm text-muted">Nenhum avulso.</p>
                  ) : (
                    <ul className="divide-y divide-line">
                      {ordenar(d.itens).map((item) => (
                        <Linha
                          key={item.jogadorId}
                          j={porId.get(item.jogadorId)}
                          item={item}
                          valorPadrao={config.valorAvulso}
                          desabilitado={!editavel || pendente}
                          onAlternar={() =>
                            executar(() => acoes.marcarAvulso(codigo, d.id, item.jogadorId, item.valorPago === null))
                          }
                        />
                      ))}
                    </ul>
                  )}
                </Cartao>
              ))}
            </div>
          )}
        </section>
      </div>

      <Aviso erro={erro} onFechar={limparErro} />
    </>
  );
}
