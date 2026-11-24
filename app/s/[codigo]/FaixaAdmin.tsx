import Link from "next/link";
import { connection } from "next/server";
import { ehAdmin } from "@/lib/auth";

/** Aviso fixo no topo quando este aparelho está logado como administrador. */
export async function FaixaAdmin() {
  // ehAdmin() confere a validade com Date.now(): precisa ser em tempo de requisição.
  await connection();
  if (!(await ehAdmin())) return null;
  return (
    <div className="bg-ink text-bg text-sm">
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 xl:px-8 min-h-10 flex items-center justify-between gap-3">
        <span className="font-medium">Modo administrador</span>
        <Link href="/admin" className="font-semibold underline underline-offset-2">
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
