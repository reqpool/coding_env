export const dynamic = "force-dynamic";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { estimations } from "@/lib/db/schema";
import { validateApiKey, getApiKey, unauthorized, notFound } from "@/lib/api/auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!validateApiKey(getApiKey(req))) return unauthorized();

  const { id } = await params;
  const [estimation] = await db
    .select()
    .from(estimations)
    .where(eq(estimations.id, id));

  if (!estimation) return notFound("Estimation not found");
  return Response.json(estimation);
}
