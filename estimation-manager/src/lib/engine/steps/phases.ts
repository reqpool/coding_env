import type { CalibrationProfile } from "@/lib/contracts/profile";
import type { EstimationResult } from "@/lib/contracts/result";

export function computePhases(
  effortPD: number,
  profile: CalibrationProfile,
): EstimationResult["phases"] {
  return profile.phases.map((phase) => ({
    name: phase.name,
    share: phase.share,
    effortPD: effortPD * phase.share,
  }));
}
