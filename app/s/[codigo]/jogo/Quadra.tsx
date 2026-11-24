"use client";

import { useState } from "react";
import { podeEntrarNoTime } from "@/lib/engine";
import { Cronometro } from "@/components/Cronometro";
import { IconeMais, IconeMenos, IconePausa, IconePlay, IconeTrofeu, IconeZerar } from "@/components/icones";
import { Modal } from "@/components/Modal";
import { Botao, Cartao, Selo, cx } from "@/components/ui";
import * as acoes from "../actions";
import { LinhaJogador } from "./LinhaJogador";
import { nome, type AcoesJogo, type DadosJogo } from "./tipos";

const COR = [
  { texto: "text-team-a", fundo: "bg-team-a-soft", borda: "border-team-a" },
  { texto: "text-team-b", fundo: "bg-team-b-soft", borda: "border-team-b" },
] as const;

export function Quadra({
  acao,
  dados,
  agoraServidor,
}: {
  acao: AcoesJogo;
  dados: DadosJogo;
  agoraServidor: number;
}) {
  const { estado } = acao.dia;
  const { config } = dados;
  const [substituindo, setSubstituindo] = useState<string | null>(null);
  const [finalizando, setFinalizando] = useState(false);

  if (estado.emQuadra.length === 0) {
    const necessarios = config.jogadoresPorTime * 2;
    const naFila = estado.fila.length;
    return (
      <Cartao className="p-6 text-center">
        <h2 className="text-lg font-bold">Sorteio dos 2 primeiros times</h2>
        <p className="mt-1 text-muted">
          {naFila} de {necessarios} jogadores na lista
          {!config.goleiroNaLista && ` · ${estado.filaGoleiros.length} goleiro(s)`}
        </p>
        <div className="mx-auto mt-4 h-2 max-w-xs rounded-full bg-surface-2 overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${Math.min(100, (naFila / necessarios) * 100)}%` }}
          />
        </div>
        {naFila < necessarios && (
          <p className="mt-3 text-sm text-muted">
            Dá para sortear antes, mas os times ficarão com menos de {config.jogadoresPorTime} jogadores.
          </p>
        )}
        {acao.editavel && (
          <Botao
            variante="primario"
            tamanho="lg"
            className="mt-5 w-full max-w-xs"
            disabled={acao.pendente || naFila < 2}
            onClick={() => acao.rodar((c, d, v) => acoes.sortearTimes(c, d, v))}
          >
            Sortear times
          </Botao>
        )}
      </Cartao>
    );
  }

  const { partida } = estado;
  const rodando = partida.iniciadaEm !== null;
  const chavePartida = `${estado.historico.length}`;
  const atingiuGols =
    config.golsParaEncerrar > 0 ? partida.placar.findIndex((g) => g >= config.golsParaEncerrar) : -1;

  const jogadorSub = substituindo ? dados.jogadores.get(substituindo) : undefined;
  const timeSub = estado.emQuadra.find((t) => substituindo && (t.jogadores.includes(substituindo) || t.goleiro === substituindo));
  const ehGoleiroSub = timeSub?.goleiro === substituindo;
  const entra = !timeSub
    ? undefined
    : ehGoleiroSub
      ? estado.filaGoleiros[0]
      : estado.fila.find((id) => podeEntrarNoTime(dados.ctx, id, timeSub.jogadores.filter((x) => x !== substituindo)));

  return (
    <div className="space-y-4 @container">
      {/* Placar e cronômetro (layout pela largura da coluna, não da tela) */}
      <Cartao className="p-4 md:p-5">
        <div className="grid grid-cols-2 @lg:grid-cols-[1fr_auto_1fr] items-start gap-2 @lg:gap-4">
          {[0, 1].map((i) => (
            <div key={i} className={cx("flex flex-col items-center", i === 0 ? "@lg:order-1" : "@lg:order-3")}>
              <span className={cx("text-sm font-bold uppercase tracking-wide", COR[i].texto)}>Time {i + 1}</span>
              <span className="tabular text-5xl @lg:text-6xl font-bold leading-tight">{partida.placar[i]}</span>
              {acao.editavel && (
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    aria-label={`Tirar gol do Time ${i + 1}`}
                    disabled={acao.pendente || partida.placar[i] === 0}
                    onClick={() => acao.rodar((c, d, v) => acoes.marcarGol(c, d, v, i as 0 | 1, -1))}
                    className="h-11 w-11 inline-flex items-center justify-center rounded-xl border border-line text-muted disabled:opacity-40"
                  >
                    <IconeMenos />
                  </button>
                  <button
                    type="button"
                    aria-label={`Gol do Time ${i + 1}`}
                    disabled={acao.pendente}
                    onClick={() => acao.rodar((c, d, v) => acoes.marcarGol(c, d, v, i as 0 | 1, 1))}
                    className={cx(
                      "h-11 w-14 inline-flex items-center justify-center rounded-xl text-white disabled:opacity-40",
                      i === 0 ? "bg-team-a" : "bg-team-b",
                    )}
                  >
                    <IconeMais />
                  </button>
                </div>
              )}
              {estado.emQuadra[i].vitoriasSeguidas > 0 && (
                <Selo tom="acento" className="mt-2">
                  <IconeTrofeu width={12} height={12} />
                  {estado.emQuadra[i].vitoriasSeguidas}
                  {config.maxVitoriasSeguidas > 0 && `/${config.maxVitoriasSeguidas}`}
                </Selo>
              )}
            </div>
          ))}
          <div className="col-span-2 @lg:col-span-1 order-first @lg:order-2 mb-2 @lg:mb-0 @lg:px-4 @lg:self-center">
            <Cronometro
              partida={partida}
              minutos={config.minutosPorPartida}
              agoraServidor={agoraServidor}
              chavePartida={chavePartida}
            />
          </div>
        </div>

        {atingiuGols >= 0 && (
          <p className="mt-4 rounded-xl bg-warn-soft text-warn px-3 py-2 text-sm font-semibold text-center">
            Time {atingiuGols + 1} chegou a {config.golsParaEncerrar} gols
          </p>
        )}

        {acao.editavel && (
          <div className="mt-4 grid grid-cols-[auto_auto_1fr] gap-2">
            <Botao
              aria-label={rodando ? "Pausar" : "Iniciar"}
              variante={rodando ? "secundario" : "primario"}
              disabled={acao.pendente}
              onClick={() => acao.rodar((c, d, v) => acoes.controlarCronometro(c, d, v, rodando ? "pausar" : "iniciar"))}
            >
              {rodando ? <IconePausa /> : <IconePlay />}
              <span className="hidden sm:inline">{rodando ? "Pausar" : "Iniciar"}</span>
            </Botao>
            <Botao
              aria-label="Zerar cronômetro"
              disabled={acao.pendente || (partida.acumuladoMs === 0 && !rodando)}
              onClick={() => acao.rodar((c, d, v) => acoes.controlarCronometro(c, d, v, "zerar"))}
            >
              <IconeZerar />
            </Botao>
            <Botao variante="primario" disabled={acao.pendente} onClick={() => setFinalizando(true)}>
              Finalizar partida
            </Botao>
          </div>
        )}
      </Cartao>

      {/* Times em quadra */}
      <div className="grid grid-cols-2 gap-3">
        {estado.emQuadra.map((time, i) => (
          <Cartao key={i} className={cx("overflow-hidden border-t-4", COR[i].borda)}>
            <div className={cx("px-3 py-2 flex items-center justify-between", COR[i].fundo)}>
              <span className={cx("font-bold", COR[i].texto)}>Time {i + 1}</span>
              <span className="text-xs text-muted">{time.jogadores.length} jog.</span>
            </div>
            <ul className="divide-y divide-line">
              {!config.goleiroNaLista && (
                <li>
                  <LinhaJogador
                    j={time.goleiro ? dados.jogadores.get(time.goleiro) : undefined}
                    goleiro
                    onClick={acao.editavel && time.goleiro ? () => setSubstituindo(time.goleiro) : undefined}
                  />
                  {!time.goleiro && <p className="px-3 pb-2 -mt-2 text-xs text-muted">Sem goleiro</p>}
                </li>
              )}
              {time.jogadores.map((id) => (
                <li key={id}>
                  <LinhaJogador
                    j={dados.jogadores.get(id)}
                    onClick={acao.editavel ? () => setSubstituindo(id) : undefined}
                  />
                </li>
              ))}
            </ul>
          </Cartao>
        ))}
      </div>
      {acao.editavel && <p className="text-center text-sm text-muted">Toque em um jogador para substituir.</p>}

      {/* Substituição */}
      <Modal aberto={!!substituindo} titulo={`Substituir ${jogadorSub?.nome ?? ""}`} onFechar={() => setSubstituindo(null)}>
        <p className="text-muted mb-4">
          {entra ? (
            <>
              Entra <strong className="text-ink">{nome(dados, entra)}</strong>, o próximo da{" "}
              {ehGoleiroSub ? "fila de goleiros" : "fila"}. Os times de espera sobem.
            </>
          ) : (
            <>Ninguém disponível na {ehGoleiroSub ? "fila de goleiros" : "fila"}: o time fica com um a menos.</>
          )}
        </p>
        <div className="grid gap-2">
          <Botao
            variante="primario"
            tamanho="lg"
            disabled={acao.pendente}
            onClick={() =>
              acao.rodar(
                (c, d, v) => acoes.substituir(c, d, v, substituindo!, true),
                () => setSubstituindo(null),
              )
            }
          >
            Sai e volta pro fim da fila
          </Botao>
          <Botao
            variante="perigo"
            tamanho="lg"
            disabled={acao.pendente}
            onClick={() =>
              acao.rodar(
                (c, d, v) => acoes.substituir(c, d, v, substituindo!, false),
                () => setSubstituindo(null),
              )
            }
          >
            Sai e foi embora
          </Botao>
          <Botao variante="fantasma" onClick={() => setSubstituindo(null)}>
            Cancelar
          </Botao>
        </div>
      </Modal>

      {/* Fim de partida */}
      <Modal aberto={finalizando} titulo="Quem venceu?" onFechar={() => setFinalizando(false)}>
        <p className="text-sm text-muted mb-4">
          Placar: Time 1 <strong className="text-ink">{partida.placar[0]}</strong> ×{" "}
          <strong className="text-ink">{partida.placar[1]}</strong> Time 2
        </p>
        <div className="grid gap-2">
          {([0, "empate", 1] as const).map((r) => (
            <button
              key={String(r)}
              type="button"
              disabled={acao.pendente}
              onClick={() =>
                acao.rodar(
                  (c, d, v) => acoes.finalizarPartida(c, d, v, r),
                  () => setFinalizando(false),
                )
              }
              className={cx(
                "rounded-2xl border-2 px-4 py-3 text-left transition disabled:opacity-50",
                r === "empate" ? "border-line hover:bg-surface-2" : cx(COR[r].borda, COR[r].fundo),
              )}
            >
              <span className={cx("block font-bold", r !== "empate" && COR[r].texto)}>
                {r === "empate" ? "Empate" : `Time ${r + 1} venceu`}
              </span>
              <span className="block text-sm text-muted">{consequencia(r, acao, dados)}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function consequencia(r: 0 | 1 | "empate", acao: AcoesJogo, dados: DadosJogo): string {
  const { emQuadra } = acao.dia.estado;
  const { config } = dados;
  if (r === "empate") {
    if (config.regraEmpate === "saemOsDois") return "Os 2 times saem (ordem sorteada) e entram os próximos.";
    const [a, b] = emQuadra;
    if (a.entrouEm === b.entrouEm) return "Os dois entraram juntos: sorteia qual time sai.";
    return `Sai o Time ${a.entrouEm < b.entrouEm ? 1 : 2}, que está há mais tempo em quadra.`;
  }
  const perdedor = r === 0 ? 2 : 1;
  const vitorias = emQuadra[r].vitoriasSeguidas + 1;
  if (config.maxVitoriasSeguidas > 0 && vitorias >= config.maxVitoriasSeguidas) {
    return `${vitorias}ª vitória seguida: atinge o limite e os 2 times saem.`;
  }
  return `Time ${perdedor} vai para o fim da fila e entra o próximo.`;
}
