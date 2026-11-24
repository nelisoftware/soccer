import { Suspense } from "react";
import { IconeBola } from "@/components/icones";
import { Cartao } from "@/components/ui";
import { FormSala } from "./FormSala";

export default function Inicio() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md md:max-w-4xl md:grid md:grid-cols-2 md:gap-10 md:items-center">
        <div className="mb-8 md:mb-0 text-center md:text-left">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-on-accent mb-4">
            <IconeBola width={32} height={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Pelada</h1>
          <p className="mt-2 text-muted md:text-lg">
            Ordem de chegada, sorteio dos times, fila, placar e financeiro, tudo junto.
          </p>
          <ul className="hidden md:block mt-6 space-y-2 text-muted">
            <li>• Crie uma sala para cada pelada (segunda, sábado…)</li>
            <li>• Quem tem o código e o PIN ajuda a gerenciar</li>
            <li>• Sem PIN, dá para acompanhar a fila em tempo real</li>
          </ul>
        </div>
        <Cartao className="p-5 md:p-6">
          <Suspense fallback={<div className="h-80" />}>
            <FormSala />
          </Suspense>
        </Cartao>
      </div>
    </main>
  );
}
