"use server";

import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { requireSession } from "./_session";
import { ok, err, type ActionResult } from "./_result";
import type { InferSelectModel } from "drizzle-orm";

export type Project = InferSelectModel<typeof projects>;

const ProjectInputSchema = z.object({
  name: z.string().min(1),
  client: z.string().optional(),
  description: z.string().optional(),
});

export async function createProject(
  input: z.infer<typeof ProjectInputSchema>,
): Promise<ActionResult<Project>> {
  try {
    const session = await requireSession();
    const parsed = ProjectInputSchema.safeParse(input);
    if (!parsed.success) return err(parsed.error.message);

    const [project] = await db
      .insert(projects)
      .values({ ...parsed.data, ownerId: session.user.id })
      .returning();

    return ok(project!);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}

export async function updateProject(
  id: string,
  input: Partial<z.infer<typeof ProjectInputSchema>>,
): Promise<ActionResult<Project>> {
  try {
    const session = await requireSession();
    const [project] = await db
      .update(projects)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(projects.id, id), eq(projects.ownerId, session.user.id)))
      .returning();

    if (!project) return err("Project not found");
    return ok(project);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}

export async function listProjects(): Promise<ActionResult<Project[]>> {
  try {
    const session = await requireSession();
    const rows = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, session.user.id))
      .orderBy(projects.createdAt);

    return ok(rows);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Unknown error");
  }
}
