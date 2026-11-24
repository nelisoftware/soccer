"use client";

import { formarTimesDaFila } from "@/lib/engine";
import { IconeBaixo, IconeCima, IconeX } from "@/components/icones";
import { Cartao, Selo, Titulo, cx } from "@/components/ui";
import * as acoes from "../actions";
import { LinhaJogador } from "./LinhaJogador";
import type { AcoesJogo, DadosJogo } from "./tipos";

function BotoesFila({ id, acao, primeiro, ultimo }: { id: string; acao: AcoesJogo; primeiro: boolean; ultimo: boolean }) {
  const base =
    "h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-30";
  return (
    <span className="flex shrink-0">
      <button
        type="button"
        aria-label="Subir na fila"
        className={base}
        disabled={acao.pendente || primeiro}
        onClick={() => acao.rodar((c, d, v) => acoes.moverNaFila(c, d, v, id, -1))}
      >
        <IconeCima width={18} height={18} />
      </button>
      <button
        type="button"
        aria-label="Descer na fila"
        className={base}
        disabled={acao.pendente || ultimo}
        onClick={() => acao.rodar((c, d, v) => acoes.moverNaFila(c, d, v, id, 1))}
      >
        <IconeBaixo width={18} height={18} />
      </button>
      <button
        type="button"
        aria-label="Foi embora (remover da fila)"
        className={cx(base, "hover:text-danger")}
        disabled={acao.pendente}
        onClick={() => acao.rodar((c, d, v) => acoes.removerDaFila(c, d, v, id))}
      >
        <IconeX width={18} height={18} />
      </button>
    </span>
  );
}

export function Fila({ acao, dados }: { acao: AcoesJogo; dados: DadosJogo }) {
  const { estado } = acao.dia;
  const { config } = dados;
  const temQuadra = estado.emQuadra.length > 0;
  const times = temQuadra ? formarTimesDaFila(estado.fila, dados.ctx) : [];
  const posicao = new Map(estado.fila.map((id, i) => [id, i]));

  return (
    <div className="space-y-4">
      {!temQuadra ? (
        <Cartao className="overflow-hidden">
          <div className="px-3 py-2 border-b border-line flex justify-between">
            <span className="font-bold">Lista de chegada</span>
            <span className="text-sm text-muted">{estado.fila.length}</span>
          </div>
          {estado.fila.length === 0 ? (
            <p className="p-4 text-sm text-muted">Ninguém chegou ainda.</p>
          ) : (
            <ul className="divide-y divide-line">
              {estado.fila.map((id, i) => (
                <li key={id}>
                  <LinhaJogador
                    j={dados.jogadores.get(id)}
                    numero={i + 1}
                    destaque={i < config.jogadoresPorTime * 2}
                    direita={
                      acao.editavel && (
                        <BotoesFila id={id} acao={acao} primeiro={i === 0} ultimo={i === estado.fila.length - 1} />
                      )
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </Cartao>
      ) : times.length === 0 ? (
        <Cartao className="p-4 text-sm text-muted">Fila vazia: todos estão em quadra.</Cartao>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-1">
          {times.map((time, t) => {
            const incompleto = time.length < config.jogadoresPorTime;
            return (
              <Cartao key={t} className="overflow-hidden">
                <div className="px-3 py-2 border-b border-line flex items-center justify-between gap-2">
                  <span className="font-bold">
                    Time {t + 3}
                    {t === 0 && (
                      <Selo tom="acento" className="ml-2 align-middle">
                        Próximo
                      </Selo>
                    )}
                  </span>
                  <span className={cx("text-sm", incompleto ? "text-warn font-semibold" : "text-muted")}>
                    {time.length}/{config.jogadoresPorTime}
                  </span>
                </div>
                <ul className="divide-y divide-line">
                  {time.map((id) => {
                    const p = posicao.get(id) ?? 0;
                    return (
                      <li key={id}>
                        <LinhaJogador
                          j={dados.jogadores.get(id)}
                          numero={p + 1}
                          direita={
                            acao.editavel && (
                              <BotoesFila id={id} acao={acao} primeiro={p === 0} ultimo={p === estado.fila.length - 1} />
                            )
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
                {incompleto && (
                  <p className="px-3 py-2 text-xs text-muted border-t border-line">
                    Completa com os primeiros do time que perder.
                  </p>
                )}
              </Cartao>
            );
          })}
        </div>
      )}

      {estado.filaGoleiros.length > 0 && (
        <div>
          <Titulo>Fila de goleiros</Titulo>
          <Cartao className="overflow-hidden">
            <ul className="divide-y divide-line">
                {estado.filaGoleiros.map((id, i) => (
                  <li key={id}>
                    <LinhaJogador
                      j={dados.jogadores.get(id)}
                      numero={i + 1}
                      goleiro
                      direita={
                        acao.editavel && (
                          <BotoesFila
                            id={id}
                            acao={acao}
                            primeiro={i === 0}
                            ultimo={i === estado.filaGoleiros.length - 1}
                          />
                        )
                      }
                    />
                  </li>
                ))}
              </ul>
          </Cartao>
        </div>
      )}
    </div>
  );
}
