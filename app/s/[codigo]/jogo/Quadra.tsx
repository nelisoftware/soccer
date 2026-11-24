"use client";

import { useState } from "react";
import {
  finalizarPartida,
  podeEntrarNoTime,
  timesQueSaem,
  type CoresEntrada,
  type TimeEmQuadra,
} from "@/lib/engine";
import { corDoTime, estiloTimes, nomeTime, resolverCor, varsCor, type CorTime } from "@/lib/cores";
import { Cronometro } from "@/components/Cronometro";
import { IconeBaixo, IconeMais, IconeMenos, IconePausa, IconePlay, IconeTrofeu, IconeZerar } from "@/components/icones";
import { Modal } from "@/components/Modal";
import { Botao, Cartao, Selo, cx } from "@/components/ui";
import * as acoes from "../actions";
import { LinhaJogador } from "./LinhaJogador";
import { SeletorCor } from "./SeletorCor";
import { nome, type AcoesJogo, type DadosJogo } from "./tipos";

const COR = [
  { texto: "text-team-a", fundo: "bg-team-a-soft", borda: "border-team-a", tinta: "bg-team-a-tinta" },
  { texto: "text-team-b", fundo: "bg-team-b-soft", borda: "border-team-b", tinta: "bg-team-b-tinta" },
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
  /** "confirmar": placar já define o vencedor; "escolher": empate (ou correção manual). */
  const [finalizando, setFinalizando] = useState<false | "confirmar" | "escolher">(false);
  /** Lado cujo colete está sendo trocado no placar. */
  const [trocandoCor, setTrocandoCor] = useState<0 | 1 | null>(null);
  /** Cor escolhida para quem entra, no fim da partida. */
  const [coresEntrada, setCoresEntrada] = useState<CoresEntrada>({});

  if (estado.emQuadra.length === 0) {
    const necessarios = config.jogadoresPorTime * 2;
    const naFila = estado.fila.length;
    return (
      <Cartao className="p-6 text-center">
        <h2 className="text-lg font-bold">Sorteio dos 2 primeiros times</h2>
        <p className="mt-1 text-muted">
          {naFila} de {necessarios} jogadores na lista
          {estado.filaGoleiros.length > 0 && ` · ${estado.filaGoleiros.length} goleiro(s)`}
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

  const sala = config.cores;
  const R = (id: CorTime) => resolverCor(id, sala);
  const cores: [CorTime, CorTime] = [corDoTime(estado.emQuadra[0], 0, sala), corDoTime(estado.emQuadra[1], 1, sala)];
  const N = (i: number) => nomeTime(R(cores[i === 0 ? 0 : 1]));

  const abrirFinalizar = () => {
    setCoresEntrada({});
    setFinalizando(vencedorPlacar !== null ? "confirmar" : "escolher");
  };

  const vencedorPlacar: 0 | 1 | null =
    partida.placar[0] === partida.placar[1] ? null : partida.placar[0] > partida.placar[1] ? 0 : 1;
  const entradaVencedor = vencedorPlacar !== null && finalizando === "confirmar" ? quemEntra(vencedorPlacar, acao, dados) : [];

  const jogadorSub = substituindo ? dados.jogadores.get(substituindo) : undefined;
  const timeSub = estado.emQuadra.find((t) => substituindo && (t.jogadores.includes(substituindo) || t.goleiro === substituindo));
  const ehGoleiroSub = timeSub?.goleiro === substituindo;
  const entra = !timeSub
    ? undefined
    : ehGoleiroSub
      ? estado.filaGoleiros[0]
      : estado.fila.find((id) => podeEntrarNoTime(dados.ctx, id, timeSub.jogadores.filter((x) => x !== substituindo)));

  return (
    <div className="space-y-4 @container" style={estiloTimes([R(cores[0]), R(cores[1])])}>
      {/* Placar e cronômetro (layout pela largura da coluna, não da tela) */}
      <Cartao className="p-4 md:p-5">
        <div className="grid grid-cols-2 @lg:grid-cols-[1fr_auto_1fr] items-start gap-2 @lg:gap-4">
          {[0, 1].map((i) => (
            <div key={i} className={cx("flex flex-col items-center", i === 0 ? "@lg:order-1" : "@lg:order-3")}>
              {acao.editavel ? (
                <button
                  type="button"
                  onClick={() => setTrocandoCor(i as 0 | 1)}
                  aria-label={`Trocar cor do ${N(i)}`}
                  className={cx(
                    "inline-flex max-w-full items-center gap-1.5 rounded-full min-h-9 pl-1 pr-2.5 text-sm font-bold uppercase tracking-wide",
                    COR[i].fundo,
                    COR[i].texto,
                  )}
                >
                  {/* shrink-0: sem isso o flex espreme a bolinha quando o nome é longo (ex.: "Time Vermelho"). */}
                  <span
                    className={cx("h-6 w-6 shrink-0 aspect-square rounded-full ring-1 ring-inset ring-black/20", COR[i].tinta)}
                  />
                  <span className="min-w-0 truncate">{N(i)}</span>
                  <IconeBaixo width={14} height={14} className="shrink-0" />
                </button>
              ) : (
                <span className={cx("text-sm font-bold uppercase tracking-wide", COR[i].texto)}>{N(i)}</span>
              )}
              <span className="tabular text-5xl @lg:text-6xl font-bold leading-tight">{partida.placar[i]}</span>
              {acao.editavel && (
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    aria-label={`Tirar gol do ${N(i)}`}
                    disabled={acao.pendente || partida.placar[i] === 0}
                    onClick={() => acao.rodar((c, d, v) => acoes.marcarGol(c, d, v, i as 0 | 1, -1))}
                    className="h-11 w-11 inline-flex items-center justify-center rounded-xl border border-line text-muted disabled:opacity-40"
                  >
                    <IconeMenos />
                  </button>
                  <button
                    type="button"
                    aria-label={`Gol do ${N(i)}`}
                    disabled={acao.pendente}
                    onClick={() => acao.rodar((c, d, v) => acoes.marcarGol(c, d, v, i as 0 | 1, 1))}
                    className={cx(
                      "h-11 w-14 inline-flex items-center justify-center rounded-xl disabled:opacity-40",
                      i === 0 ? "bg-team-a text-team-a-on" : "bg-team-b text-team-b-on",
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
            {N(atingiuGols)} chegou a {config.golsParaEncerrar} gols
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
            <Botao
              variante="primario"
              disabled={acao.pendente}
              onClick={abrirFinalizar}
            >
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
              <span className={cx("font-bold", COR[i].texto)}>{N(i)}</span>
              <span className="text-xs text-muted">{time.jogadores.length} jog.</span>
            </div>
            <ul className="divide-y divide-line">
              {time.goleiro && (
                <li>
                  <LinhaJogador
                    j={dados.jogadores.get(time.goleiro)}
                    goleiro
                    onClick={acao.editavel ? () => setSubstituindo(time.goleiro) : undefined}
                  />
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

      {/* Troca rápida da cor do colete de um time em quadra */}
      <Modal
        aberto={trocandoCor !== null}
        titulo={trocandoCor !== null ? `Cor do colete · ${N(trocandoCor)}` : ""}
        onFechar={() => setTrocandoCor(null)}
      >
        {trocandoCor !== null && (
          <>
            <SeletorCor
              cores={sala}
              rotulo="Cor do colete"
              valor={cores[trocandoCor]}
              emUso={[cores[trocandoCor === 0 ? 1 : 0]]}
              desabilitado={acao.pendente}
              onEscolher={(cor) =>
                cor === cores[trocandoCor]
                  ? setTrocandoCor(null)
                  : acao.rodar(
                      (c, d, v) => acoes.definirCorTime(c, d, v, trocandoCor, cor),
                      () => setTrocandoCor(null),
                    )
              }
            />
            <p className="mt-3 text-sm text-muted">
              Escolher a cor do outro time troca as cores dos dois.
            </p>
          </>
        )}
      </Modal>

      {/* Fim de partida com vencedor no placar: só confirma e mostra quem entra */}
      <Modal
        aberto={finalizando === "confirmar" && vencedorPlacar !== null}
        titulo={vencedorPlacar !== null ? `${N(vencedorPlacar)} venceu` : ""}
        onFechar={() => setFinalizando(false)}
      >
        {vencedorPlacar !== null && (
          <>
            <p className="text-sm text-muted">
              Placar: {N(0)} <strong className="text-ink">{partida.placar[0]}</strong> ×{" "}
              <strong className="text-ink">{partida.placar[1]}</strong> {N(1)}
            </p>
            <p className="text-sm text-muted mt-1 mb-4">{consequencia(vencedorPlacar, acao, dados)}</p>

            {entradaVencedor.map(({ idx, time }) => {
              const outro = idx === 0 ? 1 : 0;
              const outroEntra = entradaVencedor.some((x) => x.idx === outro);
              const corEntra = coresEntrada[idx] ?? cores[idx];
              const corOutro = outroEntra ? (coresEntrada[outro] ?? cores[outro]) : cores[outro];
              const escolher = (cor: CorTime) =>
                setCoresEntrada((atual) => ({
                  ...atual,
                  [idx]: cor,
                  // Os dois entrando e a cor era do outro: troca.
                  ...(outroEntra && cor === corOutro ? { [outro]: corEntra } : {}),
                }));
              return (
              <div
                key={idx}
                style={varsCor(R(corEntra))}
                className="mb-4 rounded-2xl border-2 border-team-a overflow-hidden"
              >
                <div className="px-3 py-2 font-bold bg-team-a-soft text-team-a">Entra como {nomeTime(R(corEntra))}</div>
                <div className="px-2 pt-2 pb-1 border-b border-line">
                  <p className="px-1 pb-1.5 text-xs text-muted">Cor do colete de quem entra:</p>
                  <SeletorCor
              cores={sala}
                    rotulo={`Cor do time que entra no lugar do ${N(idx)}`}
                    valor={corEntra}
                    emUso={outroEntra ? [corOutro] : []}
                    bloqueadas={outroEntra ? [] : [corOutro]}
                    onEscolher={escolher}
                  />
                </div>
                {time.goleiro || time.jogadores.length > 0 ? (
                  <ul className="divide-y divide-line">
                    {time.goleiro && (
                      <li>
                        <LinhaJogador j={dados.jogadores.get(time.goleiro)} goleiro />
                      </li>
                    )}
                    {time.jogadores.map((id) => (
                      <li key={id}>
                        <LinhaJogador j={dados.jogadores.get(id)} />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="px-3 py-2 text-sm text-muted">Ninguém na fila.</p>
                )}
              </div>
              );
            })}

            <div className="grid gap-2">
              <Botao
                variante="primario"
                tamanho="lg"
                disabled={acao.pendente}
                onClick={() =>
                  acao.rodar(
                    (c, d, v) => acoes.finalizarPartida(c, d, v, vencedorPlacar, coresEntrada),
                    () => setFinalizando(false),
                  )
                }
              >
                Confirmar resultado
              </Botao>
              <Botao variante="secundario" onClick={() => setFinalizando("escolher")}>
                Outro resultado
              </Botao>
              <Botao variante="fantasma" onClick={() => setFinalizando(false)}>
                Cancelar
              </Botao>
            </div>
          </>
        )}
      </Modal>

      {/* Empate no placar (ou correção manual): escolhe o resultado */}
      <Modal aberto={finalizando === "escolher"} titulo="Quem venceu?" onFechar={() => setFinalizando(false)}>
        <p className="text-sm text-muted mb-4">
          Placar: {N(0)} <strong className="text-ink">{partida.placar[0]}</strong> ×{" "}
          <strong className="text-ink">{partida.placar[1]}</strong> {N(1)}
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
                {r === "empate" ? "Empate" : `${N(r)} venceu`}
              </span>
              <span className="block text-sm text-muted">{consequencia(r, acao, dados)}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

/** Prévia (mesmo motor do servidor) dos times que entram se `vencedor` ganhar. */
function quemEntra(vencedor: 0 | 1, acao: AcoesJogo, dados: DadosJogo): { idx: 0 | 1; time: TimeEmQuadra }[] {
  const { estado } = acao.dia;
  try {
    const depois = finalizarPartida(estado, vencedor, dados.ctx);
    return [...timesQueSaem(estado, vencedor, dados.ctx)]
      .sort()
      .map((idx) => ({ idx: idx as 0 | 1, time: depois.emQuadra[idx] }));
  } catch {
    return [];
  }
}

function consequencia(r: 0 | 1 | "empate", acao: AcoesJogo, dados: DadosJogo): string {
  const { emQuadra } = acao.dia.estado;
  const { config } = dados;
  const N = (i: 0 | 1) => nomeTime(resolverCor(corDoTime(emQuadra[i], i, config.cores), config.cores));
  if (r === "empate") {
    if (config.regraEmpate === "saemOsDois") return "Os 2 times saem (ordem sorteada) e entram os próximos.";
    const [a, b] = emQuadra;
    if (a.entrouEm === b.entrouEm) return "Os dois entraram juntos: sorteia qual time sai.";
    return `Sai o ${N(a.entrouEm < b.entrouEm ? 0 : 1)}, que está há mais tempo em quadra.`;
  }
  const perdedor = N(r === 0 ? 1 : 0);
  const vitorias = emQuadra[r].vitoriasSeguidas + 1;
  if (config.maxVitoriasSeguidas > 0 && vitorias >= config.maxVitoriasSeguidas) {
    return `${vitorias}ª vitória seguida: atinge o limite e os 2 times saem.`;
  }
  return `${perdedor} vai para o fim da fila e entra o próximo.`;
}
