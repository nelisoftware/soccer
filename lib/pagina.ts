import "server-only";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { podeEditar } from "./auth";
import { buscarSala, type SalaDTO } from "./dal";

function decodificar(codigo: string): string {
  try {
    return decodeURIComponent(codigo);
  } catch {
    return codigo;
  }
}

/** Carrega a sala da rota e diz se este aparelho pode editar. Sempre em tempo de requisição. */
export async function carregarSala(
  params: Promise<{ codigo: string }>,
): Promise<{ sala: SalaDTO; editavel: boolean; agora: number }> {
  await connection();
  const { codigo } = await params;
  const sala = await buscarSala(decodificar(codigo));
  if (!sala) notFound();
  return { sala, editavel: await podeEditar(sala.id), agora: Date.now() };
}
