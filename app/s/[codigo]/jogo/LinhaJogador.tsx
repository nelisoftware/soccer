import type { ReactNode } from "react";
import type { JogadorDTO } from "@/lib/dal";
import { IconeLuva } from "@/components/icones";
import { Selo, cx } from "@/components/ui";

export function SelosJogador({ j, goleiro }: { j?: JogadorDTO; goleiro?: boolean }) {
  if (!j) return null;
  return (
    <>
      {(goleiro || j.posicao === "goleiro") && (
        <span title="Goleiro" className="text-muted shrink-0">
          <IconeLuva width={16} height={16} />
        </span>
      )}
      {j.idoso && <Selo tom="aviso">60+</Selo>}
    </>
  );
}

export function LinhaJogador({
  j,
  numero,
  goleiro,
  onClick,
  direita,
  destaque,
}: {
  j?: JogadorDTO;
  numero?: number;
  goleiro?: boolean;
  onClick?: () => void;
  direita?: ReactNode;
  destaque?: boolean;
}) {
  const conteudo = (
    <>
      {numero !== undefined && (
        <span className="tabular w-6 shrink-0 text-right text-sm text-muted">{numero}</span>
      )}
      <span className="min-w-0 flex-1 flex items-center gap-1.5">
        <span className="truncate font-medium">{j?.nome ?? "?"}</span>
        <SelosJogador j={j} goleiro={goleiro} />
      </span>
      {direita}
    </>
  );
  const classe = cx(
    "flex w-full items-center gap-2 min-h-11 px-3 text-left",
    destaque && "bg-accent-soft/60",
  );
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cx(classe, "hover:bg-surface-2 active:bg-surface-2")}>
        {conteudo}
      </button>
    );
  }
  return <div className={classe}>{conteudo}</div>;
}
