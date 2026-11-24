import { Suspense } from "react";
import Image from "next/image";
import logo from "@/public/logoPelada.png";
import { PoweredBy } from "@/components/PoweredBy";
import { Cartao } from "@/components/ui";
import { FormSala } from "./FormSala";

export default function Inicio() {
  return (
    <>
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md md:max-w-4xl md:grid md:grid-cols-2 md:gap-10 md:items-center">
          <div className="mb-8 md:mb-0 text-center md:text-left">
            {/* O logo já tem o nome escrito: ele é o título da página. */}
            <h1>
              <Image
                src={logo}
                alt="Pelada"
                preload
                sizes="(min-width: 768px) 176px, 144px"
                className="mx-auto md:mx-0 h-36 w-36 md:h-44 md:w-44 rounded-[22%] shadow-lg"
              />
            </h1>
            <p className="mt-4 text-muted md:text-lg">
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
      <footer className="flex justify-center px-4 pt-2 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
        <PoweredBy />
      </footer>
    </>
  );
}
