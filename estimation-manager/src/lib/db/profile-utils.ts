import { eq } from "drizzle-orm";
import { db } from "./client";
import { calibrationProfiles } from "./schema";
import type { InferSelectModel } from "drizzle-orm";
import type { CalibrationProfile } from "@/lib/contracts/profile";

export type DbProfile = InferSelectModel<typeof calibrationProfiles>;

export function buildProfile(row: DbProfile): CalibrationProfile {
  return { id: row.id, name: row.name, version: row.version, ...row.coefficients };
}

export async function resolveProfile(profileId?: string): Promise<DbProfile | null> {
  if (profileId) {
    const [p] = await db.select().from(calibrationProfiles).where(eq(calibrationProfiles.id, profileId));
    return p ?? null;
  }
  const [p] = await db.select().from(calibrationProfiles).where(eq(calibrationProfiles.isActive, true)).limit(1);
  return p ?? null;
}
