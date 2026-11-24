"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { SalaAdminDTO } from "@/lib/dal";
import { IconeBusca } from "@/components/icones";
import { Modal } from "@/components/Modal";
import { Aviso, useAcao } from "@/components/useAcao";
import { Botao, Cartao, Selo, campoClasse, cx } from "@/components/ui";
import * as acoes from "./actions";

type Dialogo =
  | { tipo: "renomear" | "pin" | "excluir"; sala: SalaAdminDTO }
  | { tipo: "pinAdmin" }
  | null;

function data(iso: string | null) {
  if (!iso) return "—";
  const d = iso.length === 10 ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const LINKS = [
  { rota: "", rotulo: "Jogo" },
  { rota: "/historico", rotulo: "Histórico" },
  { rota: "/jogadores", rotulo: "Jogadores" },
  { rota: "/financeiro", rotulo: "Financeiro" },
  { rota: "/config", rotulo: "Config" },
] as const;

export function PainelAdmin({ salas }: { salas: SalaAdminDTO[] }) {
  const { executar, pendente, erro, limparErro } = useAcao();
  const [saindo, iniciarSaida] = useTransition();
  const [busca, setBusca] = useState("");
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [texto, setTexto] = useState("");

  const abrir = (d: Dialogo, inicial = "") => {
    setTexto(inicial);
    setDialogo(d);
  };
  const fechar = () => setDialogo(null);

  const termo = busca.trim().toLowerCase();
  const visiveis = termo ? salas.filter((s) => s.codigo.includes(termo)) : salas;
  const totalJogadores = salas.reduce((n, s) => n + s.jogadores, 0);
  const abertas = salas.filter((s) => s.diaAberto).length;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 basis-full md:basis-0 md:flex-1">
          <p className="text-sm text-muted">Pelada</p>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Administração</h1>
        </div>
        <div className="flex gap-2">
          <Botao tamanho="sm" onClick={() => abrir({ tipo: "pinAdmin" })}>
            Trocar meu PIN
          </Botao>
          <Botao tamanho="sm" variante="fantasma" disabled={saindo} onClick={() => iniciarSaida(() => acoes.sairAdmin())}>
            Sair
          </Botao>
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { rotulo: "Salas", valor: salas.length },
          { rotulo: "Jogadores ativos", valor: totalJogadores },
          { rotulo: "Dias abertos agora", valor: abertas },
        ].map((k) => (
          <Cartao key={k.rotulo} className="p-4">
            <p className="text-sm text-muted">{k.rotulo}</p>
            <p className="tabular text-2xl md:text-3xl font-bold">{k.valor}</p>
          </Cartao>
        ))}
      </div>

      <div className="relative mb-4">
        <IconeBusca width={18} height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar sala pelo código"
          aria-label="Buscar sala"
          className={cx(campoClasse, "pl-10")}
        />
      </div>

      {visiveis.length === 0 ? (
        <Cartao className="p-8 text-center text-muted">
          {salas.length === 0 ? "Nenhuma sala criada ainda." : "Nenhuma sala com esse código."}
        </Cartao>
      ) : (
        <ul className="space-y-3">
          {visiveis.map((s) => {
            const base = `/s/${encodeURIComponent(s.codigo)}`;
            return (
              <li key={s.id}>
                <Cartao className="p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={base} className="text-lg font-bold hover:underline break-all">
                      {s.codigo}
                    </Link>
                    {s.diaAberto && <Selo tom="acento">Dia aberto</Selo>}
                    {s.bloqueadaAte && <Selo tom="perigo">PIN bloqueado</Selo>}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {s.jogadores} jogador{s.jogadores === 1 ? "" : "es"} ({s.mensalistas} mensalista
                    {s.mensalistas === 1 ? "" : "s"}) · {s.dias} dia{s.dias === 1 ? "" : "s"} de jogo · último{" "}
                    {data(s.ultimoDia)} · criada em {data(s.criadoEm)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {LINKS.map((l) => (
                      <Link
                        key={l.rota}
                        href={base + l.rota}
                        className="inline-flex items-center min-h-9 px-3 rounded-xl border border-line bg-surface text-sm font-medium hover:bg-surface-2"
                      >
                        {l.rotulo}
                      </Link>
                    ))}
                    <span className="hidden sm:block flex-1" />
                    <Botao tamanho="sm" variante="fantasma" onClick={() => abrir({ tipo: "renomear", sala: s }, s.codigo)}>
                      Renomear
                    </Botao>
                    <Botao tamanho="sm" variante="fantasma" onClick={() => abrir({ tipo: "pin", sala: s })}>
                      Trocar PIN
                    </Botao>
                    {s.bloqueadaAte && (
                      <Botao
                        tamanho="sm"
                        variante="fantasma"
                        disabled={pendente}
                        onClick={() => executar(() => acoes.desbloquearSala(s.id))}
                      >
                        Desbloquear
                      </Botao>
                    )}
                    <Botao tamanho="sm" variante="perigo" onClick={() => abrir({ tipo: "excluir", sala: s })}>
                      Excluir
                    </Botao>
                  </div>
                </Cartao>
              </li>
            );
          })}
        </ul>
      )}

      {/* Renomear */}
      <Modal aberto={dialogo?.tipo === "renomear"} titulo="Renomear sala" onFechar={fechar}>
        {dialogo?.tipo === "renomear" && (
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              executar(() => acoes.renomearSala(dialogo.sala.id, texto), fechar);
            }}
          >
            <p className="text-sm text-muted">
              Quem usa a sala vai precisar do código novo. O PIN e os dados continuam os mesmos.
            </p>
            <input
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Novo código"
              className={campoClasse}
            />
            <Botao type="submit" variante="primario" tamanho="lg" disabled={pendente || !texto.trim()}>
              Salvar código
            </Botao>
            <Botao variante="fantasma" onClick={fechar}>
              Cancelar
            </Botao>
          </form>
        )}
      </Modal>

      {/* Trocar PIN (sala ou admin) */}
      <Modal
        aberto={dialogo?.tipo === "pin" || dialogo?.tipo === "pinAdmin"}
        titulo={dialogo?.tipo === "pin" ? `Novo PIN da sala ${dialogo.sala.codigo}` : "Novo PIN do administrador"}
        onFechar={fechar}
      >
        {(dialogo?.tipo === "pin" || dialogo?.tipo === "pinAdmin") && (
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              executar(
                () => (dialogo.tipo === "pin" ? acoes.trocarPinSala(dialogo.sala.id, texto) : acoes.trocarPinAdmin(texto)),
                fechar,
              );
            }}
          >
            <p className="text-sm text-muted">
              {dialogo.tipo === "pin"
                ? "Quem já está editando neste aparelho continua liberado; o PIN novo vale para os próximos acessos."
                : "Use o novo PIN no próximo login com o código admin."}
            </p>
            <input
              autoFocus
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              value={texto}
              onChange={(e) => setTexto(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              autoComplete="off"
              aria-label="Novo PIN"
              className={cx(campoClasse, "tracking-[0.5em]")}
            />
            <Botao type="submit" variante="primario" tamanho="lg" disabled={pendente || texto.length !== 4}>
              Salvar PIN
            </Botao>
            <Botao variante="fantasma" onClick={fechar}>
              Cancelar
            </Botao>
          </form>
        )}
      </Modal>

      {/* Excluir */}
      <Modal aberto={dialogo?.tipo === "excluir"} titulo="Excluir sala?" onFechar={fechar}>
        {dialogo?.tipo === "excluir" && (
          <form
            className="grid gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              executar(() => acoes.excluirSala(dialogo.sala.id), fechar);
            }}
          >
            <p className="text-sm text-muted">
              Apaga a sala <strong className="text-ink">{dialogo.sala.codigo}</strong> com todos os jogadores, dias de
              jogo e pagamentos. Não dá para desfazer. Digite o código da sala para confirmar.
            </p>
            <input
              autoFocus
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder={dialogo.sala.codigo}
              aria-label="Código da sala"
              className={campoClasse}
            />
            <Botao
              type="submit"
              variante="perigo"
              tamanho="lg"
              disabled={pendente || texto.trim().toLowerCase() !== dialogo.sala.codigo}
            >
              Excluir para sempre
            </Botao>
            <Botao variante="fantasma" onClick={fechar}>
              Cancelar
            </Botao>
          </form>
        )}
      </Modal>

      <Aviso erro={erro} onFechar={limparErro} />
    </>
  );
}
