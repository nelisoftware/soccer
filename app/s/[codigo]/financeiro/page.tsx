import { Suspense } from "react";
import { avulsosPagos, listarDiasDoPeriodo, listarJogadores, mensalidadesPagas } from "@/lib/dal";
import { carregarSala } from "@/lib/pagina";
import { mesSchema } from "@/lib/validacao";
import { Carregando } from "@/components/Carregando";
import { PainelFinanceiro, type DiaAvulsos } from "./PainelFinanceiro";

export default function PaginaFinanceiro({ params, searchParams }: PageProps<"/s/[codigo]/financeiro">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo params={params} searchParams={searchParams} />
    </Suspense>
  );
}

function mesAtualSaoPaulo(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).format(
    new Date(),
  );
}

async function Conteudo({
  params,
  searchParams,
}: {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { sala, editavel } = await carregarSala(params);
  const { mes: mesParam } = await searchParams;
  const valido = mesSchema.safeParse(mesParam);
  const mes = valido.success ? valido.data : mesAtualSaoPaulo();

  const [ano, m] = mes.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, m, 0)).getUTCDate();
  const [jogadores, dias, mensalidades] = await Promise.all([
    listarJogadores(sala.id, true),
    listarDiasDoPeriodo(sala.id, `${mes}-01`, `${mes}-${String(ultimoDia).padStart(2, "0")}`),
    mensalidadesPagas(sala.id, mes),
  ]);
  const pagosPorDia = await avulsosPagos(dias.map((d) => d.id));
  const porId = new Map(jogadores.map((j) => [j.id, j]));

  const diasAvulsos: DiaAvulsos[] = dias.map((d) => {
    const pagos = pagosPorDia.get(d.id) ?? new Map<string, number>();
    const ids = new Set([...d.chegada.filter((id) => !porId.get(id)?.mensalista), ...pagos.keys()]);
    return {
      id: d.id,
      data: d.data,
      encerrado: d.encerrado,
      itens: [...ids].map((id) => ({ jogadorId: id, valorPago: pagos.get(id) ?? null })),
    };
  });

  const mensalistas = jogadores
    .filter((j) => (j.mensalista && j.ativo) || mensalidades.has(j.id))
    .map((j) => ({ jogadorId: j.id, valorPago: mensalidades.get(j.id) ?? null }));

  return (
    <PainelFinanceiro
      codigo={sala.codigo}
      editavel={editavel}
      mes={mes}
      config={sala.config}
      jogadores={jogadores}
      mensalistas={mensalistas}
      dias={diasAvulsos}
    />
  );
}
