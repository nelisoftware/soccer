"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { criarSala, entrarSala, type EstadoFormSala } from "./actions";
import { Botao, campoClasse, cx } from "@/components/ui";

export function FormSala() {
  const params = useSearchParams();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [estadoEntrar, acaoEntrar, entrando] = useActionState<EstadoFormSala, FormData>(entrarSala, {
    codigo: params.get("codigo") ?? "",
  });
  const [estadoCriar, acaoCriar, criando] = useActionState<EstadoFormSala, FormData>(criarSala, {});

  const estado = modo === "entrar" ? estadoEntrar : estadoCriar;
  const pendente = entrando || criando;

  return (
    <div>
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1 mb-5">
        {(["entrar", "criar"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={modo === m}
            onClick={() => setModo(m)}
            className={cx(
              "min-h-10 rounded-lg text-sm font-semibold transition",
              modo === m ? "bg-surface text-ink shadow-sm" : "text-muted",
            )}
          >
            {m === "entrar" ? "Entrar na sala" : "Criar sala"}
          </button>
        ))}
      </div>

      <form key={modo} action={modo === "entrar" ? acaoEntrar : acaoCriar} className="space-y-4">
        <div>
          <label htmlFor="codigo" className="block text-sm font-medium mb-1.5">
            Código da sala
          </label>
          <input
            id="codigo"
            name="codigo"
            required
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="ex.: bola23.11"
            defaultValue={estado.codigo}
            className={campoClasse}
          />
        </div>
        <div>
          <label htmlFor="pin" className="block text-sm font-medium mb-1.5">
            PIN {modo === "criar" ? "(4 dígitos, para quem vai editar)" : ""}
          </label>
          <input
            id="pin"
            name="pin"
            type="password"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            required={modo === "criar"}
            placeholder="••••"
            autoComplete="off"
            className={cx(campoClasse, "tracking-[0.5em]")}
          />
          {modo === "entrar" && (
            <p className="mt-1.5 text-sm text-muted">Sem PIN você entra só para ver.</p>
          )}
        </div>

        {estado.erro && (
          <p role="alert" className="rounded-xl bg-danger-soft text-danger px-3 py-2 text-sm font-medium">
            {estado.erro}
          </p>
        )}

        <Botao type="submit" variante="primario" tamanho="lg" className="w-full" disabled={pendente}>
          {pendente ? "Aguarde…" : modo === "entrar" ? "Entrar" : "Criar sala"}
        </Botao>
      </form>
    </div>
  );
}
