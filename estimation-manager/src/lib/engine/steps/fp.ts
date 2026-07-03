import type { EstimationInput } from "@/lib/contracts/input";
import type { CalibrationProfile } from "@/lib/contracts/profile";

export type FpResult = {
  rawFP: number;
  // FP contribution per dimension, for the dimension breakdown
  dimensionFP: {
    functionality: number; // masks + useCases
    complexity: number;    // businessObjects
    integration: number;   // interfaces + batches
    scalability: number;   // roles (users/languages handled in scale step)
  };
};

function weight(
  driver: { count: number; complexity: "low" | "medium" | "high" },
  weights: { low: number; medium: number; high: number },
): number {
  return driver.count * weights[driver.complexity];
}

export function computeFP(
  input: EstimationInput,
  profile: CalibrationProfile,
): FpResult {
  const { drivers } = input;
  const w = profile.fpWeights;

  const functionality =
    weight(drivers.masks, w.masks) +
    weight(drivers.useCases, w.useCases);

  const complexity = weight(drivers.businessObjects, w.businessObjects);

  const integration =
    weight(drivers.interfaces, w.interfaces) +
    weight(drivers.batches, w.batches);

  const scalability = weight(drivers.roles, w.roles);

  const rawFP = functionality + complexity + integration + scalability;

  return { rawFP, dimensionFP: { functionality, complexity, integration, scalability } };
}
