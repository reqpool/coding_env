import type { EstimationResult } from "@/lib/contracts/result";
import type { CalibrationProfile } from "@/lib/contracts/profile";

export function computeTotalCost(
  roles: EstimationResult["roles"],
  effortPD: number,
  profile: CalibrationProfile,
): number {
  const fromRoles = roles.reduce((sum, r) => sum + r.cost, 0);
  // Fall back to blended rate if roles produced zero cost (no daily rates set)
  return fromRoles > 0 ? fromRoles : effortPD * profile.blendedDailyRate;
}
