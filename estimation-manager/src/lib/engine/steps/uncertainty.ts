import type { CalibrationProfile } from "@/lib/contracts/profile";

export function band(
  point: number,
  profile: CalibrationProfile,
): { low: number; expected: number; high: number } {
  const pct = profile.uncertaintyPct;
  return {
    low: point * (1 - pct),
    expected: point,
    high: point * (1 + pct),
  };
}
