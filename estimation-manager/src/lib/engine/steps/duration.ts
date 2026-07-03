import type { EstimationInput } from "@/lib/contracts/input";
import type { CalibrationProfile } from "@/lib/contracts/profile";
import type { EstimationResult } from "@/lib/contracts/result";

export function computeDuration(
  effortPD: number,
  input: EstimationInput,
  profile: CalibrationProfile,
): EstimationResult["duration"] {
  const { productiveDaysPerMonth, scheduleFactor, scheduleExponent } =
    profile.duration;

  const effortPersonMonths = effortPD / productiveDaysPerMonth;
  const nominalMonths = scheduleFactor * Math.pow(effortPersonMonths, scheduleExponent);

  let capacityMonths: number | undefined;
  if (input.teamSize) {
    capacityMonths = effortPD / (input.teamSize * productiveDaysPerMonth);
  }

  const durationMonths = capacityMonths !== undefined
    ? Math.max(capacityMonths, nominalMonths)
    : nominalMonths;

  return { capacityMonths, nominalMonths, durationMonths };
}
