import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function createClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // max:1 for serverless/edge; increase for long-running Node processes
  const client = postgres(url, { max: 10 });
  return drizzle(client, { schema });
}

// Singleton to avoid creating multiple connections during dev hot-reloads
const globalForDb = globalThis as unknown as { db?: ReturnType<typeof createClient> };
export const db = globalForDb.db ?? createClient();
if (process.env.NODE_ENV !== "production") globalForDb.db = db;
