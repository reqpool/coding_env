import type { EstimationInput } from "@/lib/contracts/input";
import type { CalibrationProfile } from "@/lib/contracts/profile";

export function computeVAF(
  input: EstimationInput,
  profile: CalibrationProfile,
): number {
  const { vaf } = profile;
  const factorSum = Object.values(input.factors).reduce(
    (sum, v) => sum + (v - vaf.neutralValue),
    0,
  );
  const raw = vaf.base + vaf.slope * factorSum;
  return Math.min(Math.max(raw, vaf.min), vaf.max);
}
