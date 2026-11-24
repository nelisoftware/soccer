"use client";

import { useMemo, useState } from "react";
import type { DiaDTO, JogadorDTO } from "@/lib/dal";
import type { ConfigSala } from "@/lib/engine";
import { AutoRefresh } from "@/components/AutoRefresh";
import { CabecalhoSala } from "@/components/CabecalhoSala";
import { IconeDesfazer } from "@/components/icones";
import { Modal } from "@/components/Modal";
import { Aviso, useAcao } from "@/components/useAcao";
import { Botao, Cartao, cx } from "@/components/ui";
import * as acoes from "../actions";
import { Chegada } from "./Chegada";
import { Fila } from "./Fila";
import { Quadra } from "./Quadra";
import type { AcoesJogo, DadosJogo } from "./tipos";

type Aba = "chegada" | "quadra" | "fila";

function formatarData(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "2-digit" });
}

export function PainelJogo({
  codigo,
  config,
  jogadores,
  dia,
  editavel,
  agoraServidor,
  avulsosPagos,
}: {
  codigo: string;
  config: ConfigSala;
  jogadores: JogadorDTO[];
  dia: DiaDTO | null;
  editavel: boolean;
  agoraServidor: number;
  avulsosPagos: string[];
}) {
  const { executar, pendente, erro, limparErro } = useAcao();
  const [abaEscolhida, setAba] = useState<Aba | null>(null);
  const [encerrando, setEncerrando] = useState(false);

  const dados: DadosJogo = useMemo(() => {
    const mapa = new Map(jogadores.map((j) => [j.id, j]));
    return {
      config,
      jogadores: mapa,
      ctx: { config, info: (id) => mapa.get(id), rng: () => 0, agora: 0 },
    };
  }, [jogadores, config]);

  const pagos = useMemo(() => new Set(avulsosPagos), [avulsosPagos]);

  if (!dia) {
    return (
      <>
        <AutoRefresh intervalo={5000} />
        <CabecalhoSala codigo={codigo} titulo="Jogo" editavel={editavel} />
        <Cartao className="p-8 text-center max-w-lg mx-auto">
          <h2 className="text-xl font-bold">Nenhum dia de jogo aberto</h2>
          <p className="mt-2 text-muted">
            {editavel
              ? "Abra o dia para começar a anotar a ordem de chegada."
              : "Quando alguém abrir o dia de jogo, ele aparece aqui."}
          </p>
          {editavel && (
            <Botao
              variante="primario"
              tamanho="lg"
              className="mt-6 w-full max-w-xs"
              disabled={pendente}
              onClick={() => executar(() => acoes.iniciarDia(codigo))}
            >
              Iniciar dia de jogo
            </Botao>
          )}
          {editavel && jogadores.length === 0 && (
            <p className="mt-4 text-sm text-muted">Dica: cadastre os jogadores na aba Jogadores (ou na hora da chegada).</p>
          )}
        </Cartao>
        <Aviso erro={erro} onFechar={limparErro} />
      </>
    );
  }

  const acao: AcoesJogo = {
    codigo,
    dia,
    editavel,
    pendente,
    rodar: (fn, aoConcluir) => executar(() => fn(codigo, dia.id, dia.versao), aoConcluir),
  };

  const temQuadra = dia.estado.emQuadra.length > 0;
  const aba: Aba = abaEscolhida ?? (temQuadra ? "quadra" : "chegada");
  const ABAS: { id: Aba; rotulo: string; contagem?: number }[] = [
    { id: "chegada", rotulo: "Chegada", contagem: dia.estado.chegada.length },
    { id: "quadra", rotulo: "Quadra" },
    { id: "fila", rotulo: "Fila", contagem: dia.estado.fila.length },
  ];

  return (
    <>
      <AutoRefresh intervalo={3000} pausado={pendente} />
      <CabecalhoSala
        codigo={codigo}
        titulo={formatarData(dia.data)}
        editavel={editavel}
        acoes={
          <div className="flex gap-2">
            <Botao
              tamanho="sm"
              disabled={pendente || !dia.podeDesfazer}
              onClick={() => acao.rodar((c, d, v) => acoes.desfazer(c, d, v))}
            >
              <IconeDesfazer width={16} height={16} /> Desfazer
            </Botao>
            <Botao tamanho="sm" variante="fantasma" onClick={() => setEncerrando(true)}>
              Encerrar dia
            </Botao>
          </div>
        }
      />

      {/* Abas (até tablet). No laptop/desktop as 3 colunas ficam visíveis. */}
      <div role="tablist" className="xl:hidden sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 py-2 bg-bg/95 backdrop-blur mb-3">
        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface-2 p-1">
          {ABAS.map((a) => (
            <button
              key={a.id}
              role="tab"
              type="button"
              aria-selected={aba === a.id}
              onClick={() => setAba(a.id)}
              className={cx(
                "min-h-10 rounded-lg text-sm font-semibold transition",
                aba === a.id ? "bg-surface text-ink shadow-sm" : "text-muted",
              )}
            >
              {a.rotulo}
              {a.contagem !== undefined && <span className="ml-1 font-normal text-muted">{a.contagem}</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="xl:grid xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.5fr)_minmax(0,0.85fr)] xl:gap-6 xl:items-start">
        <section className={cx(aba !== "chegada" && "hidden", "xl:block")} aria-label="Chegada">
          <Chegada acao={acao} dados={dados} avulsosPagos={pagos} />
        </section>
        <section className={cx(aba !== "quadra" && "hidden", "xl:block")} aria-label="Quadra">
          <Quadra acao={acao} dados={dados} agoraServidor={agoraServidor} />
        </section>
        <section className={cx(aba !== "fila" && "hidden", "xl:block")} aria-label="Fila">
          <h2 className="hidden xl:block text-sm font-semibold uppercase tracking-wide text-muted mb-3">
            {temQuadra ? "Próximos times" : "Lista"}
          </h2>
          <Fila acao={acao} dados={dados} />
        </section>
      </div>

      <Modal aberto={encerrando} titulo="Encerrar o dia de jogo?" onFechar={() => setEncerrando(false)}>
        <p className="text-muted mb-4">
          A fila e os times de hoje serão fechados. Os pagamentos de avulsos continuam no Financeiro.
        </p>
        <div className="grid gap-2">
          <Botao
            variante="perigo"
            tamanho="lg"
            disabled={pendente}
            onClick={() => executar(() => acoes.encerrarDia(codigo, dia.id), () => setEncerrando(false))}
          >
            Encerrar dia
          </Botao>
          <Botao variante="fantasma" onClick={() => setEncerrando(false)}>
            Cancelar
          </Botao>
        </div>
      </Modal>

      <Aviso erro={erro} onFechar={limparErro} />
    </>
  );
}
