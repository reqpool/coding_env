import { describe, it, expect } from "vitest";
import { computeEstimation } from "../compute";
import { STANDARD_2026_PROFILE } from "@/lib/db/seed-profile";
import type { EstimationInput } from "@/lib/contracts/input";

// Baseline scenario used across multiple tests
const BASELINE_INPUT: EstimationInput = {
  drivers: {
    masks:           { count: 10, complexity: "medium" },
    useCases:        { count: 5,  complexity: "medium" },
    businessObjects: { count: 8,  complexity: "medium" },
    interfaces:      { count: 3,  complexity: "medium" },
    batches:         { count: 2,  complexity: "medium" },
    roles:           { count: 4,  complexity: "medium" },
    users: 100,
    languages: 2,
  },
  factors: {},
  currency: "EUR",
};

describe("computeEstimation — Golden Master", () => {
  it("produces correct rawFP for baseline scenario", () => {
    const result = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    // masks:10×5=50, useCases:5×7=35, bizObj:8×6=48, ifaces:3×9=27, batches:2×7=14, roles:4×2=8 → 182
    expect(result.rawFP).toBe(182);
  });

  it("VAF=1.0 when no factors provided (neutral)", () => {
    const result = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    expect(result.vaf).toBe(1.0);
    expect(result.adjustedFP).toBe(182);
  });

  it("scale factor correct for users=100 (bucket 1.10) and languages=2 (+8%)", () => {
    const result = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    expect(result.scaleFactor).toBeCloseTo(1.188, 5);
  });

  it("effort expected value matches formula", () => {
    const result = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    // 0.12 × (182 × 1.188)^1.05 × 1.10 ≈ 37.343
    expect(result.effortPD.expected).toBeCloseTo(37.343, 2);
  });

  it("uncertainty band is ±30% of expected", () => {
    const result = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    const exp = result.effortPD.expected;
    expect(result.effortPD.low).toBeCloseTo(exp * 0.70, 5);
    expect(result.effortPD.high).toBeCloseTo(exp * 1.30, 5);
  });

  it("phase shares sum to 1.0", () => {
    const result = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    const total = result.phases.reduce((s, p) => s + p.share, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it("role shares sum to 1.0", () => {
    const result = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    const total = result.roles.reduce((s, r) => s + r.share, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  it("dimension shares sum to 1.0 (within floating point)", () => {
    const result = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    const d = result.dimensions;
    const total = d.functionality + d.integration + d.complexity + d.scalability;
    expect(total).toBeCloseTo(1.0, 10);
  });

  it("total cost matches role breakdown", () => {
    const result = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    const sumFromRoles = result.roles.reduce((s, r) => s + r.cost, 0);
    expect(result.totalCost.expected).toBeCloseTo(sumFromRoles, 2);
  });

  it("is deterministic — same input produces identical output", () => {
    const a = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    const b = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    expect(a).toEqual(b);
  });

  it("handles all-zero drivers (zero FP → scale and effort still compute)", () => {
    const zeroInput: EstimationInput = {
      drivers: {
        masks:           { count: 0, complexity: "medium" },
        useCases:        { count: 0, complexity: "medium" },
        businessObjects: { count: 0, complexity: "medium" },
        interfaces:      { count: 0, complexity: "medium" },
        batches:         { count: 0, complexity: "medium" },
        roles:           { count: 0, complexity: "medium" },
        users: 0,
        languages: 1,
      },
      factors: {},
      currency: "EUR",
    };
    const result = computeEstimation(zeroInput, STANDARD_2026_PROFILE);
    expect(result.rawFP).toBe(0);
    expect(result.effortPD.expected).toBe(0);
    expect(result.totalCost.expected).toBe(0);
    // Dimensions should be safe (no NaN)
    Object.values(result.dimensions).forEach((v) => expect(isNaN(v)).toBe(false));
  });

  it("VAF clamps to min (0.65) when all factors are 0", () => {
    // 5 factors at 0: sum of deviations = 5 × (0-3) = -15 → 1.0 + 0.03×(-15) = 0.55 < 0.65
    const input: EstimationInput = {
      ...BASELINE_INPUT,
      factors: { a: 0, b: 0, c: 0, d: 0, e: 0 },
    };
    const result = computeEstimation(input, STANDARD_2026_PROFILE);
    expect(result.vaf).toBe(0.65);
  });

  it("VAF clamps to max (1.35) when all factors are 5", () => {
    // 5 factors at 5: sum of deviations = 5 × (5-3) = 10 → 1.0 + 0.03×10 = 1.30 < 1.35 — need more
    // 15 factors at 5: 15×2 = 30 → 1.0 + 0.03×30 = 1.90 > 1.35 → clamps to 1.35
    const factors: Record<string, number> = {};
    for (let i = 0; i < 15; i++) factors[`f${i}`] = 5;
    const input: EstimationInput = { ...BASELINE_INPUT, factors };
    const result = computeEstimation(input, STANDARD_2026_PROFILE);
    expect(result.vaf).toBe(1.35);
  });

  it("users ≥ 5000 uses the highest bucket multiplier (1.30)", () => {
    const input: EstimationInput = {
      ...BASELINE_INPUT,
      drivers: { ...BASELINE_INPUT.drivers, users: 10000, languages: 1 },
    };
    const result = computeEstimation(input, STANDARD_2026_PROFILE);
    expect(result.scaleFactor).toBeCloseTo(1.30, 5);
  });

  it("team size produces capacity duration", () => {
    const input: EstimationInput = { ...BASELINE_INPUT, teamSize: 5 };
    const result = computeEstimation(input, STANDARD_2026_PROFILE);
    expect(result.duration.capacityMonths).toBeDefined();
    // capacity = effort / (5 × 18)
    const expected = result.effortPD.expected / (5 * 18);
    expect(result.duration.capacityMonths).toBeCloseTo(expected, 5);
  });

  it("high complexity drivers produce higher FP than low", () => {
    const high: EstimationInput = {
      ...BASELINE_INPUT,
      drivers: { ...BASELINE_INPUT.drivers, masks: { count: 10, complexity: "high" } },
    };
    const low: EstimationInput = {
      ...BASELINE_INPUT,
      drivers: { ...BASELINE_INPUT.drivers, masks: { count: 10, complexity: "low" } },
    };
    const rHigh = computeEstimation(high, STANDARD_2026_PROFILE);
    const rLow  = computeEstimation(low,  STANDARD_2026_PROFILE);
    expect(rHigh.rawFP).toBeGreaterThan(rLow.rawFP);
  });

  it("engine version is set", () => {
    const result = computeEstimation(BASELINE_INPUT, STANDARD_2026_PROFILE);
    expect(result.engineVersion).toBe("1.0.0");
  });
});
