import { Suspense } from "react";
import { assiduidade, avulsosPagos, buscarDiaAberto, listarJogadores } from "@/lib/dal";
import { carregarSala } from "@/lib/pagina";
import { Carregando } from "@/components/Carregando";
import { PainelJogo } from "./jogo/PainelJogo";

export default function PaginaJogo({ params }: PageProps<"/s/[codigo]">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ codigo: string }> }) {
  const { sala, editavel, agora } = await carregarSala(params);
  const [jogadores, dia, frequencia] = await Promise.all([
    listarJogadores(sala.id, true),
    buscarDiaAberto(sala.id),
    assiduidade(sala.id),
  ]);
  const pagos = dia ? [...((await avulsosPagos([dia.id])).get(dia.id)?.keys() ?? [])] : [];

  return (
    <PainelJogo
      codigo={sala.codigo}
      config={sala.config}
      jogadores={jogadores}
      dia={dia}
      editavel={editavel}
      agoraServidor={agora}
      avulsosPagos={pagos}
      assiduidade={frequencia}
    />
  );
}
