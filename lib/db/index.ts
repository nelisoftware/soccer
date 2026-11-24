import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

type Banco = NodePgDatabase<typeof schema>;

// Reaproveita o pool entre recargas do dev server e invocações quentes na Vercel.
const global = globalThis as unknown as { __peladaDb?: Banco };

/** Conexão preguiçosa: não exige DATABASE_URL no build. */
export function db(): Banco {
  if (!global.__peladaDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL não configurada (veja .env.example).");
    const pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000 });
    global.__peladaDb = drizzle(pool, { schema });
  }
  return global.__peladaDb;
}

export { schema };
