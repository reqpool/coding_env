import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DrizzleClient = ReturnType<typeof drizzle<typeof schema>>;
const globalForDb = globalThis as unknown as { db?: DrizzleClient };

function createClient(): DrizzleClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  const client = postgres(url, { max: 10 });
  return drizzle(client, { schema });
}

// Proxy: the client is only created on first property access (not at import time)
export const db: DrizzleClient = new Proxy({} as DrizzleClient, {
  get(_, prop) {
    if (!globalForDb.db) {
      globalForDb.db = createClient();
    }
    return globalForDb.db[prop as keyof DrizzleClient];
  },
});
