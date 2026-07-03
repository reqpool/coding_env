export const dynamic = "force-dynamic";

import { db } from "@/lib/db/client";
import { calibrationProfiles } from "@/lib/db/schema";
import { validateApiKey, getApiKey, unauthorized } from "@/lib/api/auth";
import { desc } from "drizzle-orm";

export async function GET(req: Request) {
  if (!validateApiKey(getApiKey(req))) return unauthorized();

  const rows = await db
    .select({
      id: calibrationProfiles.id,
      name: calibrationProfiles.name,
      version: calibrationProfiles.version,
      isActive: calibrationProfiles.isActive,
      createdAt: calibrationProfiles.createdAt,
    })
    .from(calibrationProfiles)
    .orderBy(desc(calibrationProfiles.createdAt));

  return Response.json(rows);
}
