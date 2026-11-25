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

/**
 * Um apito de juiz sintetizado: tom agudo com "trinado" (a bolinha do apito),
 * um harmônico mais grave para dar corpo e um pouco de sopro (ruído).
 */
function apito(ctx: AudioContext, saida: AudioNode, quando: number, duracao: number) {
  const fim = quando + duracao;
  const envelope = ctx.createGain();
  envelope.gain.setValueAtTime(0.0001, quando);
  envelope.gain.exponentialRampToValueAtTime(1, quando + 0.02);
  envelope.gain.setValueAtTime(1, fim - 0.05);
  envelope.gain.exponentialRampToValueAtTime(0.0001, fim);
  envelope.connect(saida);

  // Trinado: oscila a frequência ~30 vezes por segundo.
  const trinado = ctx.createOscillator();
  const profundidade = ctx.createGain();
  trinado.frequency.value = 30;
  profundidade.gain.value = 220;
  trinado.connect(profundidade);

  const tons: [OscillatorType, number, number][] = [
    ["sine", 2900, 1], // o apito em si
    ["square", 1450, 0.3], // corpo, ajuda a ouvir em alto-falante pequeno
  ];
  for (const [tipo, freq, volume] of tons) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = tipo;
    osc.frequency.value = freq;
    profundidade.connect(osc.frequency);
    g.gain.value = volume;
    osc.connect(g).connect(envelope);
    osc.start(quando);
    osc.stop(fim);
  }
  trinado.start(quando);
  trinado.stop(fim);

  // Sopro: ruído filtrado em volta da frequência do apito.
  const amostras = Math.ceil(ctx.sampleRate * duracao);
  const buffer = ctx.createBuffer(1, amostras, ctx.sampleRate);
  const dados = buffer.getChannelData(0);
  for (let i = 0; i < amostras; i++) dados[i] = Math.random() * 2 - 1;
  const ruido = ctx.createBufferSource();
  ruido.buffer = buffer;
  const filtro = ctx.createBiquadFilter();
  filtro.type = "bandpass";
  filtro.frequency.value = 2900;
  filtro.Q.value = 4;
  const gRuido = ctx.createGain();
  gRuido.gain.value = 0.4;
  ruido.connect(filtro).connect(gRuido).connect(envelope);
  ruido.start(quando);
  ruido.stop(fim);
}

/** Apito final de juiz (curto, curto, looongo), repetido 2 vezes, no volume máximo. */
function bipar() {
  const ctx = obterAudio();
  if (ctx) {
    const tocar = () => {
      // Volume máximo: compressor bem agressivo, ganho alto e um limitador suave
      // (curva tanh) que segura o pico em 100% — fica alto sem estalar.
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.value = -30;
      compressor.knee.value = 0;
      compressor.ratio.value = 20;
      compressor.attack.value = 0.001;
      compressor.release.value = 0.05;
      const master = ctx.createGain();
      master.gain.value = 4;
      const limitador = ctx.createWaveShaper();
      const curva = new Float32Array(1024);
      for (let i = 0; i < curva.length; i++) curva[i] = Math.tanh(((i / (curva.length - 1)) * 2 - 1) * 3);
      limitador.curve = curva;
      limitador.oversample = "4x";
      compressor.connect(master).connect(limitador).connect(ctx.destination);

      let t = ctx.currentTime + 0.05;
      for (let rep = 0; rep < 2; rep++) {
        for (const dur of [0.3, 0.3, 1.2]) {
          apito(ctx, compressor, t, dur);
          t += dur + 0.15;
        }
        t += 0.6;
      }
    };
    if (ctx.state === "suspended") ctx.resume().then(tocar, () => {});
    else tocar();
  }
  // Vibração no mesmo ritmo do apito.
  navigator.vibrate?.([300, 150, 300, 150, 1200, 750, 300, 150, 300, 150, 1200]);
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
    <div
      className={cx(
        "text-center rounded-2xl transition-colors",
        // Tempo acabou: bloco vermelho com texto branco, bem visível de longe.
        esgotado && "bg-danger text-white py-3 px-4 shadow-lg animate-pulse",
      )}
      aria-live="polite"
    >
      <div
        className={cx(
          "tabular font-mono font-bold leading-none text-5xl md:text-6xl",
          esgotado ? "text-white" : rodando ? "text-ink" : "text-muted",
        )}
      >
        {esgotado ? `+${mmss(restante)}` : mmss(restante)}
      </div>
      <p
        className={cx(
          "mt-1 font-semibold uppercase tracking-wide",
          esgotado ? "text-sm text-white" : "text-xs text-muted",
        )}
      >
        {esgotado ? "Tempo esgotado" : rodando ? "Em andamento" : decorrido > 0 ? "Pausado" : `${minutos} min`}
      </p>
    </div>
  );
}
