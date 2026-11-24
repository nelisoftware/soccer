import { Suspense } from "react";
import { listarJogadores } from "@/lib/dal";
import { carregarSala } from "@/lib/pagina";
import { Carregando } from "@/components/Carregando";
import { ListaJogadores } from "./ListaJogadores";

export default function PaginaJogadores({ params }: PageProps<"/s/[codigo]/jogadores">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ codigo: string }> }) {
  const { sala, editavel } = await carregarSala(params);
  const jogadores = await listarJogadores(sala.id, true);
  return <ListaJogadores codigo={sala.codigo} jogadores={jogadores} editavel={editavel} />;
}
