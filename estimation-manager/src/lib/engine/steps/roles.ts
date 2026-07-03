import type { CalibrationProfile } from "@/lib/contracts/profile";
import type { EstimationResult } from "@/lib/contracts/result";

export function computeRoles(
  effortPD: number,
  profile: CalibrationProfile,
): EstimationResult["roles"] {
  return profile.roles.map((role) => {
    const roleEffort = effortPD * role.share;
    return {
      name: role.name,
      share: role.share,
      effortPD: roleEffort,
      cost: roleEffort * role.dailyRate,
      dailyRate: role.dailyRate,
    };
  });
}
