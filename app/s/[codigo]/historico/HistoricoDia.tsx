import { estiloTimes, nomeTime, resolverCor, type CorSala } from "@/lib/cores";
import { golsPorJogador, type EstadoDia, type PartidaRegistrada } from "@/lib/engine";
import { IconeBola, IconeLuva, IconeTrofeu } from "@/components/icones";
import { Cartao, Selo, Titulo, cx } from "@/components/ui";

const hora = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });

interface Linha {
  id: string;
  partidas: number;
  vitorias: number;
  empates: number;
  derrotas: number;
  goleiro: number;
  /** Tempo em quadra somado no dia, em ms. */
  tempoMs: number;
  gols: number;
}

function estatisticas(estado: EstadoDia): Linha[] {
  const mapa = new Map<string, Linha>();
  const linha = (id: string) => {
    let l = mapa.get(id);
    if (!l) mapa.set(id, (l = { id, partidas: 0, vitorias: 0, empates: 0, derrotas: 0, goleiro: 0, tempoMs: 0, gols: 0 }));
    return l;
  };
  for (const id of estado.chegada) linha(id);
  for (const p of estado.historico) {
    for (const lado of [0, 1] as const) {
      const ids = [...p.times[lado], ...(p.goleiros?.[lado] ? [p.goleiros[lado]!] : [])];
      for (const id of ids) {
        const l = linha(id);
        l.partidas++;
        if (p.goleiros?.[lado] === id) l.goleiro++;
        if (p.resultado === "empate") l.empates++;
        else if (p.resultado === lado) l.vitorias++;
        else l.derrotas++;
        // Registro antigo (sem tempo por jogador): vale a duração da partida.
        if (!p.tempos) l.tempoMs += p.duracaoMs ?? 0;
      }
    }
    // Inclui quem saiu numa substituição no meio da partida.
    for (const [id, ms] of Object.entries(p.tempos ?? {})) linha(id).tempoMs += ms;
    for (const g of p.gols ?? []) linha(g.id).gols++;
  }
  return [...mapa.values()];
}

/** 0 → "–", 42 min → "42 min", 75 min → "1h15". */
function formatarTempo(ms: number): string {
  const min = Math.round(ms / 60_000);
  if (min === 0) return ms > 0 ? "<1 min" : "–";
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
}

export function HistoricoDia({
  titulo,
  emAndamento,
  estado,
  nomes,
  coresSala,
}: {
  titulo: string;
  emAndamento: boolean;
  estado: EstadoDia;
  nomes: Record<string, string>;
  /** Cores da sala, para registros antigos que só guardavam o id da cor. */
  coresSala: CorSala[];
}) {
  const nome = (id: string) => nomes[id] ?? "?";
  const partidas = [...estado.historico].reverse();
  const linhas = estatisticas(estado);
  const jogaram = linhas.filter((l) => l.partidas > 0).length;
  const gols = estado.historico.reduce((n, p) => n + p.placar[0] + p.placar[1], 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="text-lg md:text-xl font-bold capitalize">{titulo}</h2>
        {emAndamento && <Selo tom="acento">Em andamento</Selo>}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { rotulo: "Partidas", valor: estado.historico.length },
          { rotulo: "Jogaram", valor: `${jogaram}/${estado.chegada.length}` },
          { rotulo: "Gols", valor: gols },
        ].map((k) => (
          <Cartao key={k.rotulo} className="p-4">
            <p className="text-sm text-muted">{k.rotulo}</p>
            <p className="tabular text-2xl md:text-3xl font-bold">{k.valor}</p>
          </Cartao>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] xl:items-start">
        <section aria-label="Partidas">
          <Titulo>Partidas</Titulo>
          {partidas.length === 0 ? (
            <Cartao className="p-6 text-center text-muted">Nenhuma partida finalizada neste dia.</Cartao>
          ) : (
            <ol className="space-y-3">
              {partidas.map((p) => (
                <li key={p.numero}>
                  <CartaoPartida p={p} nome={nome} coresSala={coresSala} />
                </li>
              ))}
            </ol>
          )}
        </section>

        <section aria-label="Quem jogou">
          <Titulo>Quem jogou</Titulo>
          <Cartao className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    <span className="sr-only">Ordem de chegada</span>#
                  </th>
                  <th className="px-1 py-2 text-left font-medium">Jogador</th>
                  <th className="px-1 py-2 text-right font-medium" title="Partidas">J</th>
                  <th className="px-1 py-2 text-right font-medium" title="Vitórias">V</th>
                  <th className="px-1 py-2 text-right font-medium" title="Empates">E</th>
                  <th className="px-1 py-2 text-right font-medium" title="Derrotas">D</th>
                  <th className="px-1 py-2 text-right font-medium" title="Gols">G</th>
                  <th className="px-3 py-2 text-right font-medium" title="Tempo em quadra">Tempo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {linhas.map((l, i) => (
                  <tr key={l.id} className={cx(l.partidas === 0 && "text-muted")}>
                    <td className="px-3 py-2 tabular text-muted">{i + 1}</td>
                    <td className="px-1 py-2">
                      <span className="inline-flex items-center gap-1.5">
                        {nome(l.id)}
                        {l.goleiro > 0 && (
                          <span title="Jogou no gol" className="text-muted">
                            <IconeLuva width={14} height={14} />
                          </span>
                        )}
                      </span>
                      {l.partidas === 0 && <span className="block text-xs">Chegou, não jogou</span>}
                    </td>
                    <td className="px-1 py-2 text-right tabular font-semibold">{l.partidas}</td>
                    <td className="px-1 py-2 text-right tabular">{l.vitorias}</td>
                    <td className="px-1 py-2 text-right tabular">{l.empates}</td>
                    <td className="px-1 py-2 text-right tabular">{l.derrotas}</td>
                    <td className={cx("px-1 py-2 text-right tabular", l.gols > 0 && "font-semibold")}>{l.gols}</td>
                    <td className="px-3 py-2 text-right tabular whitespace-nowrap">{formatarTempo(l.tempoMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {linhas.length === 0 && <p className="p-4 text-sm text-muted">Ninguém chegou neste dia.</p>}
          </Cartao>
          <p className="mt-2 text-xs text-muted">
            Em ordem de chegada. J = jogos, V/E/D = vitórias, empates, derrotas, G = gols. Tempo = bola rolando em quadra (quem
            entrou ou saiu numa substituição conta só o trecho que jogou).
</p>
        </section>
      </div>
    </div>
  );
}

function CartaoPartida({
  p,
  nome,
  coresSala,
}: {
  p: PartidaRegistrada;
  nome: (id: string) => string;
  coresSala: CorSala[];
}) {
  // Partidas de antes das cores: azul × vermelho, como aparecia na tela na época.
  const gravadas = p.cores ?? ["azul", "vermelho"];
  const cores = gravadas.map((c) => (typeof c === "string" ? resolverCor(c, coresSala) : c)) as [CorSala, CorSala];
  const minutos = p.duracaoMs !== undefined ? Math.round(p.duracaoMs / 60000) : null;
  const gols = golsPorJogador(p.gols);
  const marcador = (id: string) => {
    const n = gols.get(id);
    if (!n) return null;
    return (
      <span className="inline-flex items-center gap-0.5 text-xs font-bold tabular" aria-label={`${n} gol${n > 1 ? "s" : ""}`}>
        <IconeBola width={12} height={12} />
        {n > 1 && n}
      </span>
    );
  };
  const COR = [
    { texto: "text-team-a", fundo: "bg-team-a-soft", tinta: "bg-team-a-tinta" },
    { texto: "text-team-b", fundo: "bg-team-b-soft", tinta: "bg-team-b-tinta" },
  ] as const;

  return (
    <Cartao className="overflow-hidden" style={estiloTimes(cores)}>
      <div className="px-3 py-2 flex items-center justify-between gap-2 border-b border-line text-sm text-muted">
        <span className="font-semibold text-ink">Partida {p.numero}</span>
        <span className="tabular">
          fim {hora.format(p.fimEm)}
          {minutos !== null && ` · ${minutos} min`}
        </span>
      </div>

      <div className="px-3 py-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {([0, 1] as const).map((lado) => (
          <div
            key={lado}
            className={cx("flex items-center gap-2 min-w-0", lado === 0 ? "order-1" : "order-3 flex-row-reverse text-right")}
          >
            <span className={cx("h-4 w-4 shrink-0 rounded-full ring-1 ring-inset ring-black/20", COR[lado].tinta)} />
            <span className={cx("font-bold truncate", COR[lado].texto)}>{nomeTime(cores[lado])}</span>
            {p.resultado === lado && <IconeTrofeu width={16} height={16} className="shrink-0 text-warn" aria-label="Venceu" />}
          </div>
        ))}
        <div className="order-2 text-center">
          <span className="tabular text-2xl font-bold">
            {p.placar[0]} <span className="text-muted">×</span> {p.placar[1]}
          </span>
          {p.resultado === "empate" && <span className="block text-xs text-muted">Empate</span>}
        </div>
      </div>

      <div className="grid grid-cols-2 border-t border-line">
        {([0, 1] as const).map((lado) => (
          <ul key={lado} className={cx("px-3 py-2 text-sm space-y-0.5", COR[lado].fundo, lado === 1 && "text-right")}>
            {p.goleiros?.[lado] && (
              <li className={cx("flex items-center gap-1", lado === 1 && "justify-end")}>
                <IconeLuva width={14} height={14} className="text-muted shrink-0" />
                {nome(p.goleiros[lado]!)}
                {marcador(p.goleiros[lado]!)}
              </li>
            )}
            {p.times[lado].map((id) => (
              <li key={id} className={cx("flex items-center gap-1 min-w-0", lado === 1 && "justify-end")}>
                <span className="truncate">{nome(id)}</span>
                {marcador(id)}
              </li>
            ))}
            {/* Quem fez gol e saiu numa substituição antes do fim. */}
            {[...gols.keys()]
              .filter((id) => !p.times[0].includes(id) && !p.times[1].includes(id) && !p.goleiros?.includes(id))
              .filter((id) => p.gols!.some((g) => g.id === id && g.lado === lado))
              .map((id) => (
                <li key={id} className={cx("flex items-center gap-1 min-w-0 text-muted", lado === 1 && "justify-end")}>
                  <span className="truncate">{nome(id)} (saiu)</span>
                  {marcador(id)}
                </li>
              ))}
          </ul>
        ))}
      </div>
    </Cartao>
  );
}
