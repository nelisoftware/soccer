"use client";

import { useMemo, useState } from "react";
import type { AssiduidadeDTO } from "@/lib/dal";
import type { Posicao } from "@/lib/engine";
import { IconeBusca, IconeCheck, IconeMais } from "@/components/icones";
import { Modal } from "@/components/Modal";
import { Botao, Cartao, Interruptor, Selo, Titulo, campoClasse, cx, formatarReaisCurto } from "@/components/ui";
import * as acoes from "../actions";
import { LinhaJogador, SelosJogador } from "./LinhaJogador";
import type { AcoesJogo, DadosJogo } from "./tipos";

export function Chegada({
  acao,
  dados,
  avulsosPagos,
  assiduidade,
}: {
  acao: AcoesJogo;
  dados: DadosJogo;
  avulsosPagos: Set<string>;
  /** Quem mais veio nos últimos dias de jogo: esses aparecem primeiro nos cards. */
  assiduidade: Record<string, AssiduidadeDTO>;
}) {
  const { estado } = acao.dia;
  const [busca, setBusca] = useState("");
  const [novoAberto, setNovoAberto] = useState(false);

  const noDia = useMemo(() => {
    const s = new Set([...estado.fila, ...estado.filaGoleiros]);
    for (const t of estado.emQuadra) {
      t.jogadores.forEach((id) => s.add(id));
      if (t.goleiro) s.add(t.goleiro);
    }
    return s;
  }, [estado]);

  const termo = busca.trim().toLowerCase();
  // Mais assíduos primeiro; empate: quem veio mais recentemente; depois o nome (ordem da consulta).
  const disponiveis = [...dados.jogadores.values()]
    .filter((j) => j.ativo && !noDia.has(j.id))
    .filter((j) => !termo || j.nome.toLowerCase().includes(termo))
    .sort((a, b) => {
      const [fa, fb] = [assiduidade[a.id], assiduidade[b.id]];
      const NUNCA = Number.MAX_SAFE_INTEGER;
      return (fb?.dias ?? 0) - (fa?.dias ?? 0) || (fa?.ultimo ?? NUNCA) - (fb?.ultimo ?? NUNCA);
    });

  const situacao = (id: string) => {
    if (estado.emQuadra.some((t) => t.jogadores.includes(id) || t.goleiro === id)) return "quadra";
    if (noDia.has(id)) return "fila";
    return "saiu";
  };

  return (
    <div className="space-y-5">
      {acao.editavel && (
        <section>
          <Titulo
            acao={
              <Botao tamanho="sm" variante="secundario" onClick={() => setNovoAberto(true)}>
                <IconeMais width={16} height={16} /> Novo
              </Botao>
            }
          >
            Quem chegou?
          </Titulo>
          <div className="relative mb-3">
            <IconeBusca className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width={18} height={18} />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar jogador"
              aria-label="Buscar jogador"
              className={cx(campoClasse, "pl-10")}
            />
          </div>
          {disponiveis.length === 0 ? (
            <p className="text-sm text-muted">
              {dados.jogadores.size === 0
                ? "Nenhum jogador cadastrado. Toque em “Novo” para cadastrar."
                : termo
                  ? "Ninguém encontrado."
                  : "Todos os cadastrados já chegaram."}
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {disponiveis.map((j) => (
                <button
                  key={j.id}
                  type="button"
                  disabled={acao.pendente}
                  onClick={() =>
                    acao.rodar(
                      (c, d, v) => acoes.registrarChegada(c, d, v, j.id),
                      () => setBusca(""),
                    )
                  }
                  className="inline-flex items-center gap-1.5 min-h-11 rounded-xl border border-line bg-surface px-3 font-medium hover:border-accent hover:bg-accent-soft disabled:opacity-50"
                >
                  {j.nome}
                  <SelosJogador j={j} />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <Titulo>
          Chegaram hoje <span className="normal-case font-normal">({estado.chegada.length})</span>
        </Titulo>
        <Cartao className="overflow-hidden">
          {estado.chegada.length === 0 ? (
            <p className="p-4 text-sm text-muted">Ninguém ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {estado.chegada.map((id, i) => {
                const j = dados.jogadores.get(id);
                const s = situacao(id);
                const pago = avulsosPagos.has(id);
                return (
                  <li key={id}>
                    <LinhaJogador
                      j={j}
                      numero={i + 1}
                      direita={
                        <span className="flex items-center gap-1.5 shrink-0">
                          {s === "quadra" && (
                            <span title="Em quadra" className="h-2.5 w-2.5 rounded-full bg-accent">
                              <span className="sr-only">Em quadra</span>
                            </span>
                          )}
                          {s === "saiu" && <Selo>Saiu</Selo>}
                          {j?.mensalista ? (
                            <Selo>Mensal</Selo>
                          ) : (
                            <button
                              type="button"
                              disabled={!acao.editavel || acao.pendente}
                              onClick={() => acao.rodar(() => acoes.marcarAvulso(acao.codigo, acao.dia.id, id, !pago))}
                              aria-pressed={pago}
                              className={cx(
                                "inline-flex items-center gap-1 rounded-lg px-2 min-h-9 text-xs font-semibold transition disabled:cursor-default",
                                pago ? "bg-accent-soft text-accent-strong" : "bg-danger-soft text-danger",
                              )}
                            >
                              {pago && <IconeCheck width={14} height={14} />}
                              {pago ? "Pago" : formatarReaisCurto(dados.config.valorAvulso)}
                            </button>
                          )}
                        </span>
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </Cartao>
        {estado.chegada.length > 0 && (
          <p className="mt-2 text-sm text-muted">
            <span className="inline-block h-2 w-2 rounded-full bg-accent mr-1.5 align-middle" />
            em quadra · toque no valor para marcar o avulso como pago.
          </p>
        )}
      </section>

      <NovoJogador aberto={novoAberto} onFechar={() => setNovoAberto(false)} acao={acao} />
    </div>
  );
}

function NovoJogador({ aberto, onFechar, acao }: { aberto: boolean; onFechar: () => void; acao: AcoesJogo }) {
  const [nome, setNome] = useState("");
  const [posicao, setPosicao] = useState<Posicao>("jogador");
  const [idoso, setIdoso] = useState(false);
  const [mensalista, setMensalista] = useState(false);

  const fechar = () => {
    setNome("");
    setPosicao("jogador");
    setIdoso(false);
    setMensalista(false);
    onFechar();
  };

  return (
    <Modal aberto={aberto} titulo="Novo jogador" onFechar={fechar}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          acao.rodar(
            (c, d, v) => acoes.cadastrarEChegar(c, d, v, { nome, posicao, idoso, mensalista }),
            fechar,
          );
        }}
      >
        <label htmlFor="novo-nome" className="block text-sm font-medium mb-1.5">
          Nome
        </label>
        <input
          id="novo-nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          maxLength={40}
          autoFocus
          className={campoClasse}
        />
        <div className="divide-y divide-line mt-2">
          <Interruptor rotulo="Goleiro" ligado={posicao === "goleiro"} onMudar={(v) => setPosicao(v ? "goleiro" : "jogador")} />
          <Interruptor rotulo="Idoso" ligado={idoso} onMudar={setIdoso} />
          <Interruptor rotulo="Mensalista" ligado={mensalista} onMudar={setMensalista} />
        </div>
        <Botao type="submit" variante="primario" tamanho="lg" className="w-full mt-4" disabled={acao.pendente}>
          Cadastrar e marcar chegada
        </Botao>
      </form>
    </Modal>
  );
}
