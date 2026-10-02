export const dynamic = "force-dynamic";

import { EstimationInputSchema } from "@/lib/contracts/input";
import { computeEstimation } from "@/lib/engine/compute";
import { resolveProfile, buildProfile } from "@/lib/db/profile-utils";
import { validateApiKey, getApiKey, unauthorized, badRequest } from "@/lib/api/auth";

export async function POST(req: Request) {
  if (!validateApiKey(getApiKey(req))) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  // profileId lives alongside input, not inside it
  const raw = body as Record<string, unknown>;
  const profileId = typeof raw?.profileId === "string" ? raw.profileId : undefined;
  const inputPayload = raw?.input !== undefined ? raw.input : body;

  const parsed = EstimationInputSchema.safeParse(inputPayload);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const profileRow = await resolveProfile(profileId);
  if (!profileRow) {
    return Response.json({ error: "No active calibration profile found" }, { status: 422 });
  }

  const profile = buildProfile(profileRow);
  const result = computeEstimation(parsed.data, profile);
  return Response.json(result, { status: 200 });
}
