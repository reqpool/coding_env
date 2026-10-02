import type { EstimationInput } from "@/lib/contracts/input";
import type { CalibrationProfile } from "@/lib/contracts/profile";

export function computeEffort(
  adjustedFP: number,
  scaleFactor: number,
  input: EstimationInput,
  profile: CalibrationProfile,
): number {
  const { productivity, scaleExponent } = profile.effort;
  const contingency = input.contingencyPct ?? profile.effort.contingencyPct;
  return productivity * Math.pow(adjustedFP * scaleFactor, scaleExponent) * (1 + contingency);
}
