import { Suspense } from "react";
import { carregarSala } from "@/lib/pagina";
import { Carregando } from "@/components/Carregando";
import { FormConfig } from "./FormConfig";

export default function PaginaConfig({ params }: PageProps<"/s/[codigo]/config">) {
  return (
    <Suspense fallback={<Carregando />}>
      <Conteudo params={params} />
    </Suspense>
  );
}

async function Conteudo({ params }: { params: Promise<{ codigo: string }> }) {
  const { sala, editavel } = await carregarSala(params);
  return <FormConfig codigo={sala.codigo} config={sala.config} editavel={editavel} />;
}
