"use client";

import { useState } from "react";
import { CORES_SUGERIDAS, idDaCor, varsCor, type CorSala } from "@/lib/cores";
import { IconeMais, IconeX } from "@/components/icones";
import { Botao, campoClasse, cx } from "@/components/ui";

const MAX_CORES = 20;

function Bolinha({ cor, tamanho = "h-6 w-6" }: { cor: CorSala; tamanho?: string }) {
  return (
    <span
      style={varsCor(cor)}
      className={cx(tamanho, "shrink-0 aspect-square rounded-full bg-team-a-tinta ring-1 ring-inset ring-black/20")}
    />
  );
}

/** Cores de colete da sala: as que aparecem para escolher no placar. */
export function CoresSala({
  cores,
  onMudar,
  desabilitado,
}: {
  cores: CorSala[];
  onMudar: (cores: CorSala[]) => void;
  desabilitado?: boolean;
}) {
  const [adicionando, setAdicionando] = useState(false);
  const [nome, setNome] = useState("");
  const [hex, setHex] = useState("#22aa88");
  const [erro, setErro] = useState<string | null>(null);

  const sugestoes = CORES_SUGERIDAS.filter(
    (s) => !cores.some((c) => c.id === s.id || c.nome.toLowerCase() === s.nome.toLowerCase()),
  );
  const cheio = cores.length >= MAX_CORES;

  const adicionar = (cor: CorSala) => {
    onMudar([...cores, cor]);
    setErro(null);
  };

  const adicionarPersonalizada = () => {
    const n = nome.trim();
    if (!n) return setErro("Dê um nome para a cor.");
    if (n.length > 20) return setErro("Nome muito longo (até 20 letras).");
    if (cores.some((c) => c.nome.toLowerCase() === n.toLowerCase())) return setErro("Já existe uma cor com esse nome.");
    adicionar({ id: idDaCor(n, cores.map((c) => c.id)), nome: n, hex: hex.toLowerCase() });
    setNome("");
  };

  return (
    <div className="py-3">
      <ul className="flex flex-wrap gap-2">
        {cores.map((cor, i) => (
          <li
            key={cor.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface min-h-10 pl-1.5 pr-1"
          >
            <Bolinha cor={cor} />
            <span className="text-sm font-medium">{cor.nome}</span>
            {i < 2 && <span className="text-[10px] font-semibold uppercase text-muted">sorteio</span>}
            <button
              type="button"
              aria-label={`Remover ${cor.nome}`}
              disabled={desabilitado || cores.length <= 2}
              onClick={() => onMudar(cores.filter((c) => c.id !== cor.id))}
              className="ml-0.5 h-8 w-8 inline-flex items-center justify-center rounded-full text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-30"
            >
              <IconeX width={16} height={16} />
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-muted">
        Aparecem para escolher ao tocar no nome do time, no placar. As 2 primeiras vestem os times do sorteio.
      </p>

      {!desabilitado && !adicionando && (
        <Botao className="mt-3" tamanho="sm" disabled={cheio} onClick={() => setAdicionando(true)}>
          <IconeMais width={16} height={16} /> Adicionar cor
        </Botao>
      )}

      {!desabilitado && adicionando && (
        <div className="mt-3 rounded-2xl border border-line bg-surface-2/50 p-3 space-y-3">
          {sugestoes.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Sugestões</p>
              <div className="flex flex-wrap gap-2">
                {sugestoes.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    disabled={cheio}
                    onClick={() => adicionar(s)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface min-h-9 pl-1.5 pr-3 text-sm hover:bg-surface-2 disabled:opacity-40"
                  >
                    <Bolinha cor={s} tamanho="h-5 w-5" />
                    {s.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium mb-2">Outra cor</p>
            <div className="flex gap-2">
              <input
                type="color"
                value={hex}
                onChange={(e) => setHex(e.target.value)}
                aria-label="Tom da cor"
                className="h-11 w-14 shrink-0 cursor-pointer rounded-xl border border-line bg-surface p-1"
              />
              <input
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value);
                  setErro(null);
                }}
                onKeyDown={(e) => {
                  // Enter aqui não pode enviar o formulário de configurações.
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarPersonalizada();
                  }
                }}
                maxLength={20}
                placeholder="Nome (ex.: Vinho)"
                aria-label="Nome da cor"
                className={campoClasse}
              />
              <Botao disabled={cheio} onClick={adicionarPersonalizada}>
                Adicionar
              </Botao>
            </div>
            {erro && <p className="mt-1.5 text-sm text-danger">{erro}</p>}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted">{cheio ? `Limite de ${MAX_CORES} cores.` : "Lembre de salvar as configurações."}</p>
            <Botao tamanho="sm" variante="fantasma" onClick={() => setAdicionando(false)}>
              Fechar
            </Botao>
          </div>
        </div>
      )}
    </div>
  );
}
