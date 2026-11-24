import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { ConfigSala, EstadoDia, Posicao } from "../engine/types";

export const salas = pgTable(
  "salas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codigo: text("codigo").notNull(),
    pinHash: text("pin_hash").notNull(),
    config: jsonb("config").$type<ConfigSala>().notNull(),
    tentativasFalhas: integer("tentativas_falhas").notNull().default(0),
    bloqueadoAte: timestamp("bloqueado_ate", { withTimezone: true }),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("salas_codigo_idx").on(t.codigo)],
);

export const jogadores = pgTable(
  "jogadores",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    salaId: uuid("sala_id")
      .notNull()
      .references(() => salas.id, { onDelete: "cascade" }),
    nome: text("nome").notNull(),
    posicao: text("posicao").$type<Posicao>().notNull().default("jogador"),
    idoso: boolean("idoso").notNull().default(false),
    mensalista: boolean("mensalista").notNull().default(false),
    ativo: boolean("ativo").notNull().default(true),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("jogadores_sala_idx").on(t.salaId)],
);

export const diasDeJogo = pgTable(
  "dias_de_jogo",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    salaId: uuid("sala_id")
      .notNull()
      .references(() => salas.id, { onDelete: "cascade" }),
    data: date("data").notNull(),
    estado: jsonb("estado").$type<EstadoDia>().notNull(),
    versao: integer("versao").notNull().default(0),
    encerrado: boolean("encerrado").notNull().default(false),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("dias_sala_idx").on(t.salaId, t.encerrado)],
);

export const historicoEstado = pgTable(
  "historico_estado",
  {
    id: serial("id").primaryKey(),
    diaId: uuid("dia_id")
      .notNull()
      .references(() => diasDeJogo.id, { onDelete: "cascade" }),
    estado: jsonb("estado").$type<EstadoDia>().notNull(),
    descricao: text("descricao").notNull(),
    criadoEm: timestamp("criado_em", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("historico_dia_idx").on(t.diaId, t.id)],
);

export const mensalidades = pgTable(
  "mensalidades",
  {
    salaId: uuid("sala_id")
      .notNull()
      .references(() => salas.id, { onDelete: "cascade" }),
    jogadorId: uuid("jogador_id")
      .notNull()
      .references(() => jogadores.id, { onDelete: "cascade" }),
    /** YYYY-MM */
    mes: text("mes").notNull(),
    valor: integer("valor").notNull(),
    pagoEm: timestamp("pago_em", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [primaryKey({ columns: [t.jogadorId, t.mes] })],
);

export const avulsos = pgTable(
  "avulsos",
  {
    diaId: uuid("dia_id")
      .notNull()
      .references(() => diasDeJogo.id, { onDelete: "cascade" }),
    jogadorId: uuid("jogador_id")
      .notNull()
      .references(() => jogadores.id, { onDelete: "cascade" }),
    valor: integer("valor").notNull(),
    pagoEm: timestamp("pago_em", { withTimezone: true })
      .notNull()
      .default(sql`now()`),
  },
  (t) => [primaryKey({ columns: [t.diaId, t.jogadorId] })],
);
