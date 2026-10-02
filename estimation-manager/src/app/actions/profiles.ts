"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { calibrationProfiles } from "@/lib/db/schema";
import { requireAdmin, requireSession } from "./_session";
import { ok, err, type ActionResult } from "./_result";
import { CalibrationProfileSchema } from "@/lib/contracts/profile";
import type { InferSelectModel } from "drizzle-orm";

export type DbCalibrationProfile = InferSelectModel<typeof calibrationProfiles>;

export async function listProfiles(): Promise<ActionResult<DbCalibrationProfile[]>> {
  try {
    await requireSession();
    const rows = await db
      .select()
      .from(calibrationProfiles)
      .orderBy(calibrationProfiles.createdAt);
    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}

export async function getProfile(
  id: string,
): Promise<ActionResult<DbCalibrationProfile>> {
  try {
    await requireSession();
    const [profile] = await db
      .select()
      .from(calibrationProfiles)
      .where(eq(calibrationProfiles.id, id));
    if (!profile) return err("Profile not found");
    return ok(profile);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}

const UpsertProfileSchema = CalibrationProfileSchema.omit({ id: true });

export async function upsertProfile(
  input: z.infer<typeof UpsertProfileSchema>,
  existingId?: string,
): Promise<ActionResult<DbCalibrationProfile>> {
  try {
    const session = await requireAdmin();
    const parsed = UpsertProfileSchema.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);

    const { name, version, ...coefficients } = parsed.data;

    if (existingId) {
      const [updated] = await db
        .update(calibrationProfiles)
        .set({ name, version, coefficients })
        .where(eq(calibrationProfiles.id, existingId))
        .returning();
      if (!updated) return err("Profile not found");
      return ok(updated);
    }

    const [created] = await db
      .insert(calibrationProfiles)
      .values({ name, version, coefficients, createdBy: session.user.id })
      .returning();

    return ok(created!);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}

export async function setActiveProfile(
  id: string,
): Promise<ActionResult<DbCalibrationProfile>> {
  try {
    await requireAdmin();

    // Deactivate all, then activate the chosen one
    await db
      .update(calibrationProfiles)
      .set({ isActive: false });

    const [profile] = await db
      .update(calibrationProfiles)
      .set({ isActive: true })
      .where(eq(calibrationProfiles.id, id))
      .returning();

    if (!profile) return err("Profile not found");
    return ok(profile);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}
