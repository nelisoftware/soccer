import { describe, expect, it } from "vitest";
import {
  CONFIG_PADRAO,
  definirCorTime,
  estadoInicial,
  finalizarPartida,
  formarTimesDaFila,
  marcarGol,
  registrarChegada,
  removerDaFila,
  sortearTimes,
  substituir,
  zerarCronometro,
  type ConfigSala,
  type Contexto,
  type EstadoDia,
  type JogadorInfo,
} from "./index";

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const IDOSOS = new Set(["Mario", "Arcangilo", "Idoso3", "Idoso4"]);
const GOLEIROS = new Set(["G1", "G2", "G3"]);

function ctx(config: Partial<ConfigSala> = {}, seed = 1): Contexto {
  return {
    config: { ...CONFIG_PADRAO, jogadoresPorTime: 4, goleiroNaLista: true, ...config },
    info: (id): JogadorInfo => ({
      id,
      nome: id,
      idoso: IDOSOS.has(id),
      posicao: GOLEIROS.has(id) ? "goleiro" : "jogador",
    }),
    rng: mulberry32(seed),
    agora: 1_000,
  };
}

function chegar(ids: string[], c: Contexto, e: EstadoDia = estadoInicial()): EstadoDia {
  return ids.reduce((acc, id) => registrarChegada(acc, id, c), e);
}

const CHEGADA_EXEMPLO = ["Wilson", "Mario", "Bruno", "Marcus", "Nelis", "Beto", "Arcangilo", "Tito"];
const j = (n: number) => `jogador ${n}`;

/** Estado do exemplo do organizador, após o sorteio. */
function estadoExemplo(): EstadoDia {
  const c = ctx();
  const e = chegar([...CHEGADA_EXEMPLO, ...[9, 10, 11, 12, 13, 14, 15, 16].map(j)], c);
  return {
    ...e,
    fila: [9, 10, 11, 12, 13, 14, 15, 16].map(j),
    emQuadra: [
      { jogadores: ["Wilson", "Bruno", "Beto", "Arcangilo"], goleiro: null, vitoriasSeguidas: 0, entrouEm: 0 },
      { jogadores: ["Mario", "Marcus", "Nelis", "Tito"], goleiro: null, vitoriasSeguidas: 0, entrouEm: 0 },
    ],
    seq: 1,
  };
}

describe("sorteio inicial", () => {
  it("exemplo: 2 idosos ficam em times diferentes, times em ordem de chegada", () => {
    for (let seed = 1; seed <= 50; seed++) {
      const c = ctx({}, seed);
      const e = sortearTimes(chegar(CHEGADA_EXEMPLO, c), c);
      const [a, b] = e.emQuadra;
      expect(a.jogadores).toHaveLength(4);
      expect(b.jogadores).toHaveLength(4);
      expect(a.jogadores.filter((id) => IDOSOS.has(id))).toHaveLength(1);
      expect(b.jogadores.filter((id) => IDOSOS.has(id))).toHaveLength(1);
      expect([...a.jogadores, ...b.jogadores].sort()).toEqual([...CHEGADA_EXEMPLO].sort());
      for (const t of [a, b]) {
        const pos = t.jogadores.map((id) => CHEGADA_EXEMPLO.indexOf(id));
        expect(pos).toEqual([...pos].sort((x, y) => x - y));
      }
      expect(e.fila).toEqual([]);
    }
  });

  it("o sorteio é aleatório (sementes diferentes geram times diferentes)", () => {
    const resultados = new Set(
      [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => {
        const c = ctx({}, seed);
        return sortearTimes(chegar(CHEGADA_EXEMPLO, c), c).emQuadra[0].jogadores.join(",");
      }),
    );
    expect(resultados.size).toBeGreaterThan(1);
  });

  it("idoso extra cede a vaga e vai para o Time 3", () => {
    const chegada = ["A", "Mario", "B", "Arcangilo", "Idoso3", "C", "D", "E", "F", "G"];
    const c = ctx();
    const e = sortearTimes(chegar(chegada, c), c);
    const emQuadra = e.emQuadra.flatMap((t) => t.jogadores);
    expect(emQuadra).not.toContain("Idoso3");
    expect(emQuadra.sort()).toEqual(["A", "Arcangilo", "B", "C", "D", "E", "F", "Mario"].sort());
    expect(e.fila).toEqual(["Idoso3", "G"]);
  });

  it("exceção: sem gente suficiente, um time fica com 2 idosos em vez de jogar com um a menos", () => {
    // 9 jogadores, 4 idosos, 4 por time: só 5 não idosos para 8 vagas.
    const chegada = ["A", "Mario", "Arcangilo", "Idoso3", "Idoso4", "B", "C", "D", "E"];
    for (let seed = 1; seed <= 30; seed++) {
      const c = ctx({}, seed);
      const e = sortearTimes(chegar(chegada, c), c);
      const [a, b] = e.emQuadra;
      expect(a.jogadores).toHaveLength(4);
      expect(b.jogadores).toHaveLength(4);
      const idososPorTime = [a, b].map((t) => t.jogadores.filter((id) => IDOSOS.has(id)).length).sort();
      expect(idososPorTime).toEqual([1, 2]);
      expect(e.fila).toEqual(["Idoso4"]);
    }
  });

  it("sem limite de idosos, pega simplesmente os 2×N primeiros", () => {
    const chegada = ["Mario", "Arcangilo", "Idoso3", "A", "B", "C", "D", "E", "F"];
    const c = ctx({ permiteMaisDeUmIdoso: true });
    const e = sortearTimes(chegar(chegada, c), c);
    expect(e.fila).toEqual(["F"]);
  });

  it("com goleiro fora da lista, cada time recebe o próximo da fila de goleiros", () => {
    const c = ctx({ goleiroNaLista: false });
    const e = sortearTimes(chegar(["G1", ...CHEGADA_EXEMPLO, "G2", "G3"], c), c);
    expect(e.emQuadra.map((t) => t.goleiro)).toEqual(["G1", "G2"]);
    expect(e.filaGoleiros).toEqual(["G3"]);
    expect(e.emQuadra.flatMap((t) => t.jogadores)).not.toContain("G1");
  });

  it("com goleiro na lista, goleiro é jogador comum", () => {
    const c = ctx({ goleiroNaLista: true });
    const e = chegar(["G1", "A"], c);
    expect(e.fila).toEqual(["G1", "A"]);
    expect(e.filaGoleiros).toEqual([]);
  });
});

describe("times de espera derivados da fila", () => {
  it("agrupa em times de N por ordem de chegada", () => {
    const c = ctx();
    expect(formarTimesDaFila([9, 10, 11, 12, 13, 14].map(j), c)).toEqual([
      [j(9), j(10), j(11), j(12)],
      [j(13), j(14)],
    ]);
  });

  it("idoso pula para o próximo time sem idoso", () => {
    const c = ctx();
    expect(formarTimesDaFila(["Mario", "A", "Arcangilo", "B", "C", "D"], c)).toEqual([
      ["Mario", "A", "B", "C"],
      ["Arcangilo", "D"],
    ]);
  });

  it("exceção: só sobraram idosos, eles completam o mesmo time", () => {
    const c = ctx();
    expect(formarTimesDaFila(["Mario", "Arcangilo"], c)).toEqual([["Mario", "Arcangilo"]]);
    expect(formarTimesDaFila(["Mario", "A", "Arcangilo", "B", "C", "Idoso3"], c)).toEqual([
      ["Mario", "A", "B", "C"],
      ["Arcangilo", "Idoso3"],
    ]);
  });
});

describe("substituição", () => {
  it("exemplo do Mario: entra o jogador 9 e todos os times sobem", () => {
    const c = ctx();
    const e = substituir(estadoExemplo(), "Mario", true, c);
    expect(e.emQuadra[1].jogadores).toEqual(["Marcus", "Nelis", "Tito", j(9)]);
    expect(formarTimesDaFila(e.fila, c)).toEqual([
      [j(10), j(11), j(12), j(13)],
      [j(14), j(15), j(16), "Mario"],
    ]);
  });

  it("exceção: se na fila só há idosos, entra o primeiro deles", () => {
    const c = ctx();
    const base = estadoExemplo();
    base.fila = ["Idoso3", "Idoso4"];
    const e = substituir(base, "Wilson", false, c); // time de Wilson já tem o Arcangilo
    expect(e.emQuadra[0].jogadores).toContain("Idoso3");
    expect(e.fila).toEqual(["Idoso4"]);
  });

  it("substituído que foi embora não volta para a fila", () => {
    const e = substituir(estadoExemplo(), "Mario", false, ctx());
    expect(e.fila).not.toContain("Mario");
    expect(e.fila[0]).toBe(j(10));
  });

  describe("temporária", () => {
    /** Mario se machuca; o jogador 9 entra emprestado do Time 3. */
    const comTemporario = () => substituir(estadoExemplo(), "Mario", true, ctx(), true);

    it("quem entra não perde o lugar na fila", () => {
      const e = comTemporario();
      expect(e.emQuadra[1].jogadores).toEqual(["Marcus", "Nelis", "Tito", j(9)]);
      expect(e.emQuadra[1].temporarios).toEqual([j(9)]);
      expect(e.fila).toEqual([...[9, 10, 11, 12, 13, 14, 15, 16].map(j), "Mario"]);
    });

    it("outra substituição pula quem já está em quadra como temporário", () => {
      const e = substituir(comTemporario(), "Wilson", true, ctx());
      expect(e.emQuadra[0].jogadores).toContain(j(10));
      expect(e.fila[0]).toBe(j(9));
    });

    it("time perdeu: o temporário volta e joga com o time dele", () => {
      const e = finalizarPartida(comTemporario(), 0, ctx());
      expect(e.emQuadra[1].jogadores).toEqual([j(9), j(10), j(11), j(12)]);
      expect(e.emQuadra[1].temporarios).toBeUndefined();
      expect(e.fila).toEqual([j(13), j(14), j(15), j(16), "Mario", "Marcus", "Nelis", "Tito"]);
      // O histórico registra quem jogou de fato.
      expect(e.historico[0].times[1]).toEqual(["Marcus", "Nelis", "Tito", j(9)]);
    });

    it("time ganhou: o temporário fica e o time dele completa com o próximo", () => {
      const e = finalizarPartida(comTemporario(), 1, ctx());
      expect(e.emQuadra[1].jogadores).toEqual(["Marcus", "Nelis", "Tito", j(9)]);
      expect(e.emQuadra[1].temporarios).toBeUndefined();
      expect(e.emQuadra[0].jogadores).toEqual([j(10), j(11), j(12), j(13)]);
      expect(e.fila).not.toContain(j(9));
    });

    it("temporário substituído de novo volta para o lugar dele na fila", () => {
      const e = substituir(comTemporario(), j(9), true, ctx(), true);
      expect(e.emQuadra[1].jogadores).toEqual(["Marcus", "Nelis", "Tito", j(10)]);
      expect(e.emQuadra[1].temporarios).toEqual([j(10)]);
      expect(e.fila.slice(0, 2)).toEqual([j(9), j(10)]);
      expect(e.fila).toHaveLength(9);
    });

    it("não dá para remover da fila quem está em quadra como temporário", () => {
      expect(() => removerDaFila(comTemporario(), j(9))).toThrow(/temporário/);
    });
  });

  it("não coloca segundo idoso no time: pega o próximo não idoso", () => {
    const base = estadoExemplo();
    base.fila = ["Idoso3", j(9), j(10)];
    const e = substituir(base, "Marcus", true, ctx());
    expect(e.emQuadra[1].jogadores).toEqual(["Mario", "Nelis", "Tito", j(9)]);
    expect(e.fila).toEqual(["Idoso3", j(10), "Marcus"]);
  });

  it("substituição de goleiro usa a fila de goleiros", () => {
    const c = ctx({ goleiroNaLista: false });
    const base = estadoExemplo();
    base.emQuadra[0].goleiro = "G1";
    base.filaGoleiros = ["G2"];
    const e = substituir(base, "G1", true, c);
    expect(e.emQuadra[0].goleiro).toBe("G2");
    expect(e.filaGoleiros).toEqual(["G1"]);
  });
});

describe("cores dos coletes", () => {
  it("quem entra herda a cor de quem saiu, ou usa a cor escolhida", () => {
    const base = estadoExemplo();
    base.emQuadra[0].cor = "branco";
    base.emQuadra[1].cor = "preto";
    expect(finalizarPartida(base, 0, ctx()).emQuadra.map((t) => t.cor)).toEqual(["branco", "preto"]);
    expect(finalizarPartida(base, 0, ctx(), { 1: "amarelo" }).emQuadra.map((t) => t.cor)).toEqual(["branco", "amarelo"]);
  });

  it("não deixa o time que entra usar a cor do time que fica", () => {
    const base = estadoExemplo();
    base.emQuadra[0].cor = "branco";
    expect(() => finalizarPartida(base, 0, ctx(), { 1: "branco" })).toThrow();
  });

  it("trocar para a cor do outro time troca os dois", () => {
    // Sem cor gravada, os times usam as 2 primeiras da sala: preto e azul.
    const base = estadoExemplo();
    const e = definirCorTime(base, 0, "azul", ctx());
    expect(e.emQuadra.map((t) => t.cor)).toEqual(["azul", "preto"]);
    expect(definirCorTime(e, 1, "amarelo", ctx()).emQuadra.map((t) => t.cor)).toEqual(["azul", "amarelo"]);
  });

  it("só aceita cores da sala; cores novas da sala passam a valer", () => {
    const base = estadoExemplo();
    expect(() => definirCorTime(base, 0, "vinho", ctx())).toThrow();
    const comVinho = ctx({ cores: [...CONFIG_PADRAO.cores, { id: "vinho", nome: "Vinho", hex: "#7a1f35" }] });
    expect(definirCorTime(base, 0, "vinho", comVinho).emQuadra[0].cor).toBe("vinho");
    expect(() => finalizarPartida(base, 0, ctx(), { 1: "vinho" })).toThrow();
  });

  it("sorteio veste os times com as 2 primeiras cores da sala", () => {
    const c = ctx();
    const e = sortearTimes(chegar(CHEGADA_EXEMPLO, c), c);
    expect(e.emQuadra.map((t) => t.cor)).toEqual(["preto", "azul"]);
  });

  it("o histórico guarda cores, goleiros, placar e duração", () => {
    const base = estadoExemplo();
    base.emQuadra[0].cor = "branco";
    base.emQuadra[1].cor = "preto";
    base.partida = { iniciadaEm: null, acumuladoMs: 480_000, placar: [2, 1] };
    const [p] = finalizarPartida(base, 0, ctx()).historico;
    expect(p).toMatchObject({
      numero: 1,
      cores: [
        { id: "branco", nome: "Branco", hex: "#ffffff" },
        { id: "preto", nome: "Preto" },
      ],
      goleiros: [null, null], placar: [2, 1], resultado: 0, duracaoMs: 480_000 });
    expect(p.times[1]).toEqual(["Mario", "Marcus", "Nelis", "Tito"]);
  });

  it("tempo de cada jogador conta só o trecho em quadra (substituição no meio)", () => {
    const base = estadoExemplo();
    base.partida = { iniciadaEm: null, acumuladoMs: 8 * 60_000, placar: [0, 0] };
    // Aos 8 min, Mario sai e entra o jogador 9.
    const sub = substituir(base, "Mario", true, ctx());
    sub.partida.acumuladoMs = 10 * 60_000;
    const [p] = finalizarPartida(sub, 0, ctx()).historico;
    expect(p.tempos?.["Mario"]).toBe(8 * 60_000);
    expect(p.tempos?.[j(9)]).toBe(2 * 60_000);
    expect(p.tempos?.["Wilson"]).toBe(10 * 60_000);
    expect(p.tempos?.["Marcus"]).toBe(10 * 60_000);
  });

  it("gols com autor: somam no placar e vão para o histórico", () => {
    let e = marcarGol(estadoExemplo(), 0, 1, "Wilson");
    e = marcarGol(e, 0, 1, "Wilson");
    e = marcarGol(e, 1, 1); // sem autor
    e = marcarGol(e, 1, 1, "Mario");
    expect(e.partida.placar).toEqual([2, 2]);
    expect(() => marcarGol(e, 0, 1, "Mario")).toThrow(/não está nesse time/);
    const [p] = finalizarPartida(e, "empate", ctx()).historico;
    expect(p.gols).toEqual([
      { id: "Wilson", lado: 0 },
      { id: "Wilson", lado: 0 },
      { id: "Mario", lado: 1 },
    ]);
  });

  it("tirar gol: sai primeiro o gol sem autor; com autor, sai o gol dele", () => {
    let e = marcarGol(estadoExemplo(), 0, 1, "Wilson");
    e = marcarGol(e, 0, 1); // sem autor
    e = marcarGol(e, 0, -1);
    expect(e.partida.placar[0]).toBe(1);
    expect(e.partida.gols).toEqual([{ id: "Wilson", lado: 0 }]);
    e = marcarGol(e, 0, -1);
    expect(e.partida.placar[0]).toBe(0);
    expect(e.partida.gols).toBeUndefined();
  });

  it("zerar o cronômetro zera também a contagem por jogador", () => {
    const base = estadoExemplo();
    base.partida = { iniciadaEm: null, acumuladoMs: 5 * 60_000, placar: [0, 0] };
    const e = zerarCronometro(substituir(base, "Mario", true, ctx()));
    expect(e.partida.entradas).toBeUndefined();
    expect(e.partida.tempoSaiu).toBeUndefined();
  });
});

describe("fim de partida", () => {
  it("perdedor vai para o fim da fila e o Time 3 entra", () => {
    const c = ctx();
    const e = finalizarPartida(estadoExemplo(), 0, c);
    expect(e.emQuadra[0].jogadores).toEqual(["Wilson", "Bruno", "Beto", "Arcangilo"]);
    expect(e.emQuadra[0].vitoriasSeguidas).toBe(1);
    expect(e.emQuadra[1].jogadores).toEqual([j(9), j(10), j(11), j(12)]);
    expect(e.fila).toEqual([j(13), j(14), j(15), j(16), "Mario", "Marcus", "Nelis", "Tito"]);
    expect(e.historico).toHaveLength(1);
  });

  it("perdedor completa o último time incompleto com seus primeiros jogadores", () => {
    const base = estadoExemplo();
    base.fila = [j(9), j(10), j(11)];
    const e = finalizarPartida(base, 0, ctx());
    expect(e.emQuadra[1].jogadores).toEqual([j(9), j(10), j(11), "Mario"]);
    expect(e.fila).toEqual(["Marcus", "Nelis", "Tito"]);
  });

  it("limite de vitórias: os 2 saem, vencedor primeiro para a fila", () => {
    const c = ctx({ maxVitoriasSeguidas: 2 });
    const base = estadoExemplo();
    base.emQuadra[0].vitoriasSeguidas = 1;
    const e = finalizarPartida(base, 0, c);
    expect(e.emQuadra.map((t) => t.jogadores)).toEqual([
      [j(9), j(10), j(11), j(12)],
      [j(13), j(14), j(15), j(16)],
    ]);
    expect(e.fila).toEqual(["Wilson", "Bruno", "Beto", "Arcangilo", "Mario", "Marcus", "Nelis", "Tito"]);
  });

  it("empate 'saem os 2': ambos saem, em ordem sorteada", () => {
    const ordens = new Set<string>();
    for (let seed = 1; seed <= 20; seed++) {
      const e = finalizarPartida(estadoExemplo(), "empate", ctx({ regraEmpate: "saemOsDois" }, seed));
      expect(e.emQuadra.flatMap((t) => t.jogadores).sort()).toEqual(
        [9, 10, 11, 12, 13, 14, 15, 16].map(j).sort(),
      );
      ordens.add(e.fila[0]);
      // Quem ganhou o sorteio é quem foi primeiro para a fila.
      const { sorteioEmpate } = e.historico.at(-1)!;
      expect(sorteioEmpate?.regra).toBe("saemOsDois");
      expect(e.fila[0]).toBe(estadoExemplo().emQuadra[sorteioEmpate!.vencedor].jogadores[0]);
    }
    expect(ordens).toEqual(new Set(["Wilson", "Mario"]));
  });

  it("empate 'sai o mais antigo': sai quem está há mais tempo em quadra", () => {
    const base = estadoExemplo();
    base.emQuadra[0].entrouEm = 0;
    base.emQuadra[1].entrouEm = 3;
    const e = finalizarPartida(base, "empate", ctx({ regraEmpate: "saiMaisAntigo" }));
    expect(e.emQuadra[1].jogadores).toEqual(["Mario", "Marcus", "Nelis", "Tito"]);
    expect(e.emQuadra[0].jogadores).toEqual([j(9), j(10), j(11), j(12)]);
    expect(e.historico.at(-1)!.sorteioEmpate).toBeUndefined();
  });

  it("goleiro do perdedor vai para o fim da fila de goleiros e o próximo entra", () => {
    const c = ctx({ goleiroNaLista: false });
    const base = estadoExemplo();
    base.emQuadra[0].goleiro = "G1";
    base.emQuadra[1].goleiro = "G2";
    base.filaGoleiros = ["G3"];
    const e = finalizarPartida(base, 0, c);
    expect(e.emQuadra.map((t) => t.goleiro)).toEqual(["G1", "G3"]);
    expect(e.filaGoleiros).toEqual(["G2"]);
  });

  it("novo time respeita a regra de idoso ao entrar", () => {
    const base = estadoExemplo();
    base.fila = ["Idoso3", j(9), j(10), j(11), j(12), j(13), j(14), j(15)];
    const e = finalizarPartida(base, 1, ctx());
    // Time 1 perdeu (tinha Arcangilo); entra o próximo time derivado.
    expect(e.emQuadra[0].jogadores).toEqual(["Idoso3", j(9), j(10), j(11)]);
  });
});

describe("chegada e fila", () => {
  it("não deixa o mesmo jogador chegar duas vezes", () => {
    const c = ctx();
    expect(() => chegar(["A", "A"], c)).toThrow();
  });

  it("remove quem foi embora da fila", () => {
    const c = ctx();
    const e = removerDaFila(chegar(["A", "B", "C"], c), "B");
    expect(e.fila).toEqual(["A", "C"]);
  });
});
