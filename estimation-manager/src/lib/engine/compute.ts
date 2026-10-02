import type { EstimationInput } from "@/lib/contracts/input";
import type { CalibrationProfile } from "@/lib/contracts/profile";
import type { EstimationResult } from "@/lib/contracts/result";
import { ENGINE_VERSION } from "./engine-version";
import { computeFP } from "./steps/fp";
import { computeVAF } from "./steps/vaf";
import { computeScaleFactor } from "./steps/scale";
import { computeEffort } from "./steps/effort";
import { computePhases } from "./steps/phases";
import { computeRoles } from "./steps/roles";
import { computeTotalCost } from "./steps/cost";
import { computeDuration } from "./steps/duration";
import { band } from "./steps/uncertainty";

export function computeEstimation(
  input: EstimationInput,
  profile: CalibrationProfile,
): EstimationResult {
  // Step 1 — Raw FP
  const { rawFP, dimensionFP } = computeFP(input, profile);

  // Step 2 — VAF
  const vaf = computeVAF(input, profile);
  const adjustedFP = rawFP * vaf;

  // Step 3 — Scale factor
  const scaleFactor = computeScaleFactor(input, profile);

  // Step 4 — Effort (expected point estimate)
  const effortPDExpected = computeEffort(adjustedFP, scaleFactor, input, profile);

  // Step 5 — Phase breakdown
  const phases = computePhases(effortPDExpected, profile);

  // Step 6 — Role breakdown
  const roles = computeRoles(effortPDExpected, profile);

  // Step 7 — Cost
  const totalCostExpected = computeTotalCost(roles, effortPDExpected, profile);

  // Step 8 — Duration
  const duration = computeDuration(effortPDExpected, input, profile);

  // Step 9 — Uncertainty bands
  const effortPD = band(effortPDExpected, profile);
  const totalCost = band(totalCostExpected, profile);

  // Dimension shares (as fraction of total rawFP; avoids division-by-zero)
  const fpBase = rawFP > 0 ? rawFP : 1;
  const dimensions = {
    functionality: dimensionFP.functionality / fpBase,
    integration: dimensionFP.integration / fpBase,
    complexity: dimensionFP.complexity / fpBase,
    scalability: dimensionFP.scalability / fpBase,
  };

  return {
    engineVersion: ENGINE_VERSION,
    profileId: profile.id,
    profileVersion: profile.version,
    rawFP,
    vaf,
    adjustedFP,
    scaleFactor,
    effortPD,
    totalCost,
    duration,
    phases,
    roles,
    dimensions,
    currency: input.currency,
  };
}
