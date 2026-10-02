import type { EstimationInput } from "@/lib/contracts/input";
import type { CalibrationProfile } from "@/lib/contracts/profile";

function usersMultiplier(users: number, buckets: CalibrationProfile["scale"]["userBuckets"]): number {
  for (const bucket of buckets) {
    if (users < bucket.maxUsers) return bucket.multiplier;
  }
  // fallback to last bucket multiplier
  return buckets[buckets.length - 1]!.multiplier;
}

export function computeScaleFactor(
  input: EstimationInput,
  profile: CalibrationProfile,
): number {
  const { users, languages } = input.drivers;
  const { scale } = profile;
  const uMult = usersMultiplier(users, scale.userBuckets);
  const langMult = 1 + scale.langSlope * (languages - 1);
  return uMult * langMult;
}
