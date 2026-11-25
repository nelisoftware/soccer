"use client";

import { useEffect, useRef, useState } from "react";
import { tempoDecorridoMs, type Partida } from "@/lib/engine";
import { cx } from "./ui";

/**
 * Um único AudioContext para a página. Navegadores (principalmente no celular) só
 * liberam áudio depois de um toque do usuário, então ele é "destravado" no primeiro
 * toque/tecla e reaproveitado quando o tempo acaba.
 */
let audio: AudioContext | null = null;

function obterAudio(): AudioContext | null {
  if (audio) return audio;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio = new Ctx();
  } catch {
    audio = null;
  }
  return audio;
}

function destravarAudio() {
  const ctx = obterAudio();
  if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});
}

function bipar() {
  const ctx = obterAudio();
  if (ctx) {
    const tocar = () => {
      const inicio = ctx.currentTime + 0.05;
      // 3 séries de 3 bipes (agudo, agudo, mais agudo): alarme de fim de tempo.
      for (let serie = 0; serie < 3; serie++) {
        [0, 0.2, 0.4].forEach((t, i) => {
          const quando = inicio + serie * 0.9 + t;
          const osc = ctx.createOscillator();
          const ganho = ctx.createGain();
          osc.type = "square";
          osc.frequency.value = i === 2 ? 1320 : 880;
          ganho.gain.setValueAtTime(0.0001, quando);
          ganho.gain.exponentialRampToValueAtTime(0.3, quando + 0.01);
          ganho.gain.exponentialRampToValueAtTime(0.0001, quando + 0.18);
          osc.connect(ganho).connect(ctx.destination);
          osc.start(quando);
          osc.stop(quando + 0.2);
        });
      }
    };
    if (ctx.state === "suspended") ctx.resume().then(tocar, () => {});
    else tocar();
  }
  navigator.vibrate?.([300, 150, 300, 150, 300, 400, 300, 150, 300, 150, 300]);
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
    window.addEventListener("pointerdown", destravarAudio);
    window.addEventListener("keydown", destravarAudio);
    return () => {
      window.removeEventListener("pointerdown", destravarAudio);
      window.removeEventListener("keydown", destravarAudio);
    };
  }, []);

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
