import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ehAdmin } from "@/lib/auth";
import { listarSalasAdmin } from "@/lib/dal";
import { Carregando } from "@/components/Carregando";
import { PainelAdmin } from "./PainelAdmin";

export default function PaginaAdmin() {
  return (
    <main className="flex-1 w-full max-w-screen-lg mx-auto px-4 md:px-6 pt-4 md:pt-8 pb-10">
      <Suspense fallback={<Carregando />}>
        <Conteudo />
      </Suspense>
    </main>
  );
}

async function Conteudo() {
  await connection();
  if (!(await ehAdmin())) redirect("/?codigo=admin");
  return <PainelAdmin salas={await listarSalasAdmin()} />;
}
