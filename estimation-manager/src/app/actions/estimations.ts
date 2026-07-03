"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { estimations, calibrationProfiles, projects } from "@/lib/db/schema";
import { requireSession } from "./_session";
import { ok, err, type ActionResult } from "./_result";
import { EstimationInputSchema } from "@/lib/contracts/input";
import { computeEstimation } from "@/lib/engine/compute";
import { ENGINE_VERSION } from "@/lib/engine/engine-version";
import type { EstimationResult } from "@/lib/contracts/result";
import type { EstimationInput } from "@/lib/contracts/input";
import type { CalibrationProfile } from "@/lib/contracts/profile";
import type { InferSelectModel } from "drizzle-orm";

export type Estimation = InferSelectModel<typeof estimations>;

// Live preview — computes without persisting
export async function computeEstimationAction(
  input: EstimationInput,
  profileId?: string,
): Promise<ActionResult<EstimationResult>> {
  try {
    await requireSession();

    const parsed = EstimationInputSchema.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);

    const profile = await resolveProfile(profileId);
    if (!profile) return err("Calibration profile not found");

    const result = computeEstimation(parsed.data, buildProfile(profile));
    return ok(result);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}

// Save a snapshot — freezes input + result + versions
export async function saveEstimation(
  projectId: string,
  input: EstimationInput,
  title: string,
  profileId?: string,
): Promise<ActionResult<Estimation>> {
  try {
    const session = await requireSession();

    const parsed = EstimationInputSchema.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);

    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerId, session.user.id)));
    if (!project) return err("Project not found");

    const profile = await resolveProfile(profileId);
    if (!profile) return err("Calibration profile not found");

    const fullProfile = buildProfile(profile);
    const result = computeEstimation(parsed.data, fullProfile);

    const [estimation] = await db
      .insert(estimations)
      .values({
        projectId,
        title,
        input: parsed.data,
        profileId: profile.id,
        profileVersion: profile.version,
        engineVersion: ENGINE_VERSION,
        result,
        createdBy: session.user.id,
      })
      .returning();

    return ok(estimation!);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}

export async function listEstimations(
  projectId: string,
): Promise<ActionResult<Estimation[]>> {
  try {
    const session = await requireSession();

    // Verify project access
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerId, session.user.id)));
    if (!project) return err("Project not found");

    const rows = await db
      .select()
      .from(estimations)
      .where(eq(estimations.projectId, projectId))
      .orderBy(estimations.createdAt);

    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}

export async function getEstimation(
  id: string,
): Promise<ActionResult<Estimation>> {
  try {
    const session = await requireSession();
    const [estimation] = await db
      .select()
      .from(estimations)
      .where(eq(estimations.id, id));

    if (!estimation) return err("Estimation not found");

    // Verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(
        and(
          eq(projects.id, estimation.projectId),
          eq(projects.ownerId, session.user.id),
        ),
      );
    if (!project) return err("Estimation not found");

    return ok(estimation);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}

export async function archiveEstimation(
  id: string,
): Promise<ActionResult<Estimation>> {
  try {
    const session = await requireSession();
    const existing = await getEstimation(id);
    if (!existing.success) return existing;

    const [updated] = await db
      .update(estimations)
      .set({ status: "archived", updatedAt: new Date() })
      .where(and(eq(estimations.id, id), eq(estimations.createdBy, session.user.id)))
      .returning();

    if (!updated) return err("Estimation not found");
    return ok(updated);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}

export async function duplicateEstimation(
  id: string,
  newTitle?: string,
): Promise<ActionResult<Estimation>> {
  try {
    const session = await requireSession();
    const existing = await getEstimation(id);
    if (!existing.success) return existing;

    const source = existing.data;
    const [clone] = await db
      .insert(estimations)
      .values({
        projectId: source.projectId,
        title: newTitle ?? `${source.title} (Kopie)`,
        input: source.input,
        profileId: source.profileId,
        profileVersion: source.profileVersion,
        engineVersion: source.engineVersion,
        result: source.result,
        status: "draft",
        createdBy: session.user.id,
      })
      .returning();

    return ok(clone!);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function resolveProfile(profileId?: string) {
  if (profileId) {
    const [p] = await db
      .select()
      .from(calibrationProfiles)
      .where(eq(calibrationProfiles.id, profileId));
    return p ?? null;
  }
  const [p] = await db
    .select()
    .from(calibrationProfiles)
    .where(eq(calibrationProfiles.isActive, true))
    .limit(1);
  return p ?? null;
}

type DbProfile = InferSelectModel<typeof calibrationProfiles>;

function buildProfile(row: DbProfile): CalibrationProfile {
  return {
    id: row.id,
    name: row.name,
    version: row.version,
    ...row.coefficients,
  };
}
