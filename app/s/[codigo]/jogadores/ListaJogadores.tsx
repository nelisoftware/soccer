"use client";

import { useState } from "react";
import type { JogadorDTO } from "@/lib/dal";
import type { Posicao } from "@/lib/engine";
import { CabecalhoSala } from "@/components/CabecalhoSala";
import { IconeBusca, IconeMais } from "@/components/icones";
import { Modal } from "@/components/Modal";
import { Aviso, useAcao } from "@/components/useAcao";
import { Botao, Cartao, Interruptor, Selo, campoClasse, cx } from "@/components/ui";
import { SelosJogador } from "../jogo/LinhaJogador";
import * as acoes from "../actions";

type Edicao = { id: string | null; nome: string; posicao: Posicao; idoso: boolean; mensalista: boolean };

export function ListaJogadores({
  codigo,
  jogadores,
  editavel,
}: {
  codigo: string;
  jogadores: JogadorDTO[];
  editavel: boolean;
}) {
  const { executar, pendente, erro, limparErro } = useAcao();
  const [edicao, setEdicao] = useState<Edicao | null>(null);
  const [busca, setBusca] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(false);

  const termo = busca.trim().toLowerCase();
  const filtrados = jogadores
    .filter((j) => mostrarInativos || j.ativo)
    .filter((j) => !termo || j.nome.toLowerCase().includes(termo));
  const ativos = jogadores.filter((j) => j.ativo);
  const inativos = jogadores.length - ativos.length;

  return (
    <>
      <CabecalhoSala
        codigo={codigo}
        titulo="Jogadores"
        editavel={editavel}
        acoes={
          <Botao
            variante="primario"
            onClick={() => setEdicao({ id: null, nome: "", posicao: "jogador", idoso: false, mensalista: false })}
          >
            <IconeMais width={18} height={18} /> Novo jogador
          </Botao>
        }
      />

      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-sm text-muted">
        <span>{ativos.length} ativos</span>
        <span>{ativos.filter((j) => j.mensalista).length} mensalistas</span>
        <span>{ativos.filter((j) => j.posicao === "goleiro").length} goleiros</span>
        <span>{ativos.filter((j) => j.idoso).length} idosos</span>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <IconeBusca className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" width={18} height={18} />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar"
            aria-label="Buscar jogador"
            className={cx(campoClasse, "pl-10")}
          />
        </div>
        {inativos > 0 && (
          <Botao variante="fantasma" onClick={() => setMostrarInativos((v) => !v)}>
            {mostrarInativos ? "Ocultar inativos" : `Mostrar inativos (${inativos})`}
          </Botao>
        )}
      </div>

      {filtrados.length === 0 ? (
        <Cartao className="p-6 text-center text-muted">
          {jogadores.length === 0 ? "Nenhum jogador cadastrado ainda." : "Ninguém encontrado."}
        </Cartao>
      ) : (
        <Cartao className="overflow-hidden">
          <ul className="divide-y divide-line md:grid md:grid-cols-2 md:divide-y-0 2xl:grid-cols-3">
            {filtrados.map((j) => (
              <li key={j.id} className="md:border-b md:border-line">
                <button
                  type="button"
                  disabled={!editavel}
                  onClick={() => setEdicao({ ...j })}
                  className={cx(
                    "flex w-full items-center gap-2 min-h-14 px-4 text-left hover:bg-surface-2 disabled:hover:bg-transparent",
                    !j.ativo && "opacity-60",
                  )}
                >
                  <span className="min-w-0 flex-1 flex items-center gap-1.5">
                    <span className="truncate font-medium">{j.nome}</span>
                    <SelosJogador j={j} />
                  </span>
                  {j.mensalista && <Selo tom="acento">Mensal</Selo>}
                  {!j.ativo && <Selo>Inativo</Selo>}
                </button>
              </li>
            ))}
          </ul>
        </Cartao>
      )}

      <Modal
        aberto={!!edicao}
        titulo={edicao?.id ? "Editar jogador" : "Novo jogador"}
        onFechar={() => setEdicao(null)}
      >
        {edicao && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const { id, ...dados } = edicao;
              executar(() => acoes.salvarJogador(codigo, id, dados), () => setEdicao(null));
            }}
          >
            <label htmlFor="jogador-nome" className="block text-sm font-medium mb-1.5">
              Nome
            </label>
            <input
              id="jogador-nome"
              value={edicao.nome}
              onChange={(e) => setEdicao({ ...edicao, nome: e.target.value })}
              required
              maxLength={40}
              autoFocus
              className={campoClasse}
            />
            <div className="divide-y divide-line mt-2">
              <Interruptor
                rotulo="Goleiro"
                ligado={edicao.posicao === "goleiro"}
                onMudar={(v) => setEdicao({ ...edicao, posicao: v ? "goleiro" : "jogador" })}
              />
              <Interruptor
                rotulo="Idoso"
                descricao="Conta para a regra de idosos por time"
                ligado={edicao.idoso}
                onMudar={(v) => setEdicao({ ...edicao, idoso: v })}
              />
              <Interruptor
                rotulo="Mensalista"
                descricao="Paga por mês, em vez de avulso"
                ligado={edicao.mensalista}
                onMudar={(v) => setEdicao({ ...edicao, mensalista: v })}
              />
            </div>
            <div className="grid gap-2 mt-4">
              <Botao type="submit" variante="primario" tamanho="lg" disabled={pendente}>
                Salvar
              </Botao>
              {edicao.id && (
                <Botao
                  variante={jogadores.find((j) => j.id === edicao.id)?.ativo ? "perigo" : "secundario"}
                  disabled={pendente}
                  onClick={() => {
                    const atual = jogadores.find((j) => j.id === edicao.id);
                    executar(() => acoes.definirAtivo(codigo, edicao.id!, !atual?.ativo), () => setEdicao(null));
                  }}
                >
                  {jogadores.find((j) => j.id === edicao.id)?.ativo ? "Desativar jogador" : "Reativar jogador"}
                </Botao>
              )}
            </div>
          </form>
        )}
      </Modal>

      <Aviso erro={erro} onFechar={limparErro} />
    </>
  );
}
