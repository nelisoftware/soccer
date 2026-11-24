import Link from "next/link";
import { Cartao } from "@/components/ui";

export default function SalaNaoEncontrada() {
  return (
    <Cartao className="p-8 text-center max-w-md mx-auto mt-10">
      <h1 className="text-xl font-bold">Sala não encontrada</h1>
      <p className="mt-2 text-muted">Confira o código ou crie uma sala nova.</p>
      <Link
        href="/"
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-accent px-5 font-semibold text-on-accent"
      >
        Voltar ao início
      </Link>
    </Cartao>
  );
}
