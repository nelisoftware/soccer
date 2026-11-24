"use client";

import { useState, useTransition, type ReactNode } from "react";
import type { ConfigSala } from "@/lib/engine";
import { sairDaSala } from "@/app/actions";
import { CabecalhoSala } from "@/components/CabecalhoSala";
import { Aviso, useAcao } from "@/components/useAcao";
import { Botao, Cartao, Interruptor, Titulo, campoClasse, cx } from "@/components/ui";
import * as acoes from "../actions";

function Numero({
  id,
  rotulo,
  descricao,
  valor,
  onMudar,
  min,
  max,
  passo = 1,
  prefixo,
  desabilitado,
}: {
  id: string;
  rotulo: string;
  descricao?: string;
  valor: number;
  onMudar: (v: number) => void;
  min: number;
  max: number;
  passo?: number;
  prefixo?: string;
  desabilitado?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <label htmlFor={id} className="min-w-0">
        <span className="block text-[15px] font-medium">{rotulo}</span>
        {descricao && <span className="block text-sm text-muted">{descricao}</span>}
      </label>
      <div className="relative w-28 shrink-0">
        {prefixo && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">{prefixo}</span>}
        <input
          id={id}
          type="number"
          inputMode={passo < 1 ? "decimal" : "numeric"}
          min={min}
          max={max}
          step={passo}
          value={Number.isFinite(valor) ? valor : ""}
          disabled={desabilitado}
          onChange={(e) => onMudar(e.target.valueAsNumber)}
          className={cx(campoClasse, "text-right tabular", prefixo && "pl-9")}
        />
      </div>
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section>
      <Titulo>{titulo}</Titulo>
      <Cartao className="px-4 divide-y divide-line">{children}</Cartao>
    </section>
  );
}

export function FormConfig({ codigo, config, editavel }: { codigo: string; config: ConfigSala; editavel: boolean }) {
  const { executar, pendente, erro, limparErro } = useAcao();
  const [saindo, iniciarSaida] = useTransition();
  const [c, setC] = useState({
    ...config,
    valorAvulso: config.valorAvulso / 100,
    valorMensalidade: config.valorMensalidade / 100,
  });
  const [salvo, setSalvo] = useState(false);
  const set = <K extends keyof typeof c>(k: K, v: (typeof c)[K]) => {
    setSalvo(false);
    setC((atual) => ({ ...atual, [k]: v }));
  };
  const off = !editavel;

  return (
    <>
      <CabecalhoSala codigo={codigo} titulo="Configurações" editavel={editavel} />

      <form
        className="grid gap-6 xl:grid-cols-2 xl:items-start"
        onSubmit={(e) => {
          e.preventDefault();
          executar(
            () =>
              acoes.salvarConfig(codigo, {
                ...c,
                valorAvulso: Math.round(c.valorAvulso * 100),
                valorMensalidade: Math.round(c.valorMensalidade * 100),
              }),
            () => setSalvo(true),
          );
        }}
      >
        <div className="grid gap-6">
          <Grupo titulo="Times">
            <Numero
              id="jogadoresPorTime"
              rotulo="Jogadores por time"
              descricao={c.goleiroNaLista ? "Contando o goleiro" : "Só jogadores de linha"}
              valor={c.jogadoresPorTime}
              onMudar={(v) => set("jogadoresPorTime", v)}
              min={2}
              max={11}
              desabilitado={off}
            />
            <Interruptor
              rotulo="Goleiro entra na lista"
              descricao={
                c.goleiroNaLista
                  ? "Goleiro entra na fila como qualquer jogador"
                  : "Goleiros têm fila própria; o goleiro do time que sai vai pro fim dela"
              }
              ligado={c.goleiroNaLista}
              onMudar={(v) => set("goleiroNaLista", v)}
              desabilitado={off}
            />
            <Interruptor
              rotulo="Mais de 1 idoso por time"
              descricao={
                c.permiteMaisDeUmIdoso
                  ? "Idosos entram normalmente pela ordem de chegada"
                  : "No máximo 1 idoso por time; o idoso extra vai para o próximo time"
              }
              ligado={c.permiteMaisDeUmIdoso}
              onMudar={(v) => set("permiteMaisDeUmIdoso", v)}
              desabilitado={off}
            />
          </Grupo>

          <Grupo titulo="Partida">
            <Numero
              id="minutos"
              rotulo="Minutos por partida"
              valor={c.minutosPorPartida}
              onMudar={(v) => set("minutosPorPartida", v)}
              min={1}
              max={90}
              desabilitado={off}
            />
            <Numero
              id="gols"
              rotulo="Gols para encerrar"
              descricao="0 = sem limite de gols"
              valor={c.golsParaEncerrar}
              onMudar={(v) => set("golsParaEncerrar", v)}
              min={0}
              max={20}
              desabilitado={off}
            />
            <Numero
              id="maxVitorias"
              rotulo="Máximo de vitórias seguidas"
              descricao="Ao atingir, os 2 times saem. 0 = sem limite"
              valor={c.maxVitoriasSeguidas}
              onMudar={(v) => set("maxVitoriasSeguidas", v)}
              min={0}
              max={20}
              desabilitado={off}
            />
            <div className="py-3">
              <p className="text-[15px] font-medium mb-2">Em caso de empate</p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["saemOsDois", "Saem os 2 times"],
                    ["saiMaisAntigo", "Sai o mais antigo"],
                  ] as const
                ).map(([valor, rotulo]) => (
                  <button
                    key={valor}
                    type="button"
                    disabled={off}
                    aria-pressed={c.regraEmpate === valor}
                    onClick={() => set("regraEmpate", valor)}
                    className={cx(
                      "min-h-11 rounded-xl border-2 px-3 text-sm font-semibold transition",
                      c.regraEmpate === valor ? "border-accent bg-accent-soft text-accent-strong" : "border-line text-muted",
                    )}
                  >
                    {rotulo}
                  </button>
                ))}
              </div>
            </div>
          </Grupo>
        </div>

        <div className="grid gap-6">
          <Grupo titulo="Valores">
            <Numero
              id="avulso"
              rotulo="Avulso (por dia)"
              prefixo="R$"
              passo={0.5}
              valor={c.valorAvulso}
              onMudar={(v) => set("valorAvulso", v)}
              min={0}
              max={10000}
              desabilitado={off}
            />
            <Numero
              id="mensalidade"
              rotulo="Mensalidade"
              prefixo="R$"
              passo={0.5}
              valor={c.valorMensalidade}
              onMudar={(v) => set("valorMensalidade", v)}
              min={0}
              max={10000}
              desabilitado={off}
            />
          </Grupo>

          {editavel && (
            <div className="flex flex-col gap-2">
              <Botao type="submit" variante="primario" tamanho="lg" disabled={pendente}>
                {pendente ? "Salvando…" : salvo ? "Salvo ✓" : "Salvar configurações"}
              </Botao>
              <p className="text-sm text-muted">
                Mudanças valem a partir da próxima ação (times já em quadra não são refeitos).
              </p>
            </div>
          )}

          <Grupo titulo="Compartilhar">
            <div className="py-3 text-sm">
              <p>
                Para outra pessoa ajudar, ela entra com o código <strong className="font-mono">{codigo}</strong> e o PIN.
                Sem PIN, ela só acompanha.
              </p>
            </div>
            {editavel && (
              <div className="py-3">
                <Botao
                  variante="perigo"
                  className="w-full"
                  disabled={saindo}
                  onClick={() => iniciarSaida(() => sairDaSala(codigo))}
                >
                  Sair da sala neste aparelho
                </Botao>
              </div>
            )}
          </Grupo>
        </div>
      </form>

      <Aviso erro={erro} onFechar={limparErro} />
    </>
  );
}
