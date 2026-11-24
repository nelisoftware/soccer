"use client";

import { useEffect, useRef, useState } from "react";
import { tempoDecorridoMs, type Partida } from "@/lib/engine";
import { cx } from "./ui";

function bipar() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.35, 0.7].forEach((t) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.frequency.value = 880;
      ganho.gain.setValueAtTime(0.25, ctx.currentTime + t);
      ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.3);
      osc.connect(ganho).connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.3);
    });
    setTimeout(() => ctx.close(), 1500);
  } catch {
    /* sem áudio */
  }
  navigator.vibrate?.([300, 150, 300, 150, 300]);
}

function mmss(ms: number) {
  const total = Math.ceil(Math.abs(ms) / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Contagem regressiva calculada a partir do horário do servidor,
 * então todos os aparelhos da sala mostram o mesmo tempo.
 */
export function Cronometro({
  partida,
  minutos,
  agoraServidor,
  chavePartida,
}: {
  partida: Partida;
  minutos: number;
  agoraServidor: number;
  chavePartida: string;
}) {
  const [agora, setAgora] = useState(agoraServidor);
  const [desvio] = useState(() => agoraServidor - Date.now());
  const avisou = useRef<string | null>(null);
  const rodando = partida.iniciadaEm !== null;

  useEffect(() => {
    if (!rodando) return;
    const id = setInterval(() => setAgora(Date.now() + desvio), 250);
    return () => clearInterval(id);
  }, [rodando, desvio]);

  const decorrido = tempoDecorridoMs(partida, rodando ? agora : agoraServidor);
  const restante = minutos * 60_000 - decorrido;
  const esgotado = restante <= 0;

  useEffect(() => {
    if (esgotado && rodando && avisou.current !== chavePartida) {
      avisou.current = chavePartida;
      bipar();
    }
  }, [esgotado, rodando, chavePartida]);

  return (
    <div className="text-center" aria-live="polite">
      <div
        className={cx(
          "tabular font-mono font-bold leading-none text-5xl md:text-6xl",
          esgotado ? "text-danger animate-pulse" : rodando ? "text-ink" : "text-muted",
        )}
      >
        {esgotado ? `+${mmss(restante)}` : mmss(restante)}
      </div>
      <p className={cx("mt-1 text-xs font-semibold uppercase tracking-wide", esgotado ? "text-danger" : "text-muted")}>
        {esgotado ? "Tempo esgotado" : rodando ? "Em andamento" : decorrido > 0 ? "Pausado" : `${minutos} min`}
      </p>
    </div>
  );
}
