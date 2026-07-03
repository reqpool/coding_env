import { z } from "zod";

const FpWeightSetSchema = z.object({
  low: z.number().positive(),
  medium: z.number().positive(),
  high: z.number().positive(),
});

const PhaseSchema = z.object({
  name: z.string(),
  share: z.number().min(0).max(1),
});

const RoleSchema = z.object({
  name: z.string(),
  share: z.number().min(0).max(1),
  dailyRate: z.number().positive(),
});

const UserBucketSchema = z.object({
  maxUsers: z.number().int().positive().or(z.literal(Infinity)),
  multiplier: z.number().positive(),
});

export const CalibrationProfileSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string(),
  version: z.number().int().positive().default(1),

  // Step 1 — FP weights per driver
  fpWeights: z.object({
    masks: FpWeightSetSchema,
    useCases: FpWeightSetSchema,
    businessObjects: FpWeightSetSchema,
    interfaces: FpWeightSetSchema,
    batches: FpWeightSetSchema,
    roles: FpWeightSetSchema,
  }),

  // Step 2 — VAF
  vaf: z.object({
    base: z.number().positive(),
    slope: z.number(),
    min: z.number().positive(),
    max: z.number().positive(),
    neutralValue: z.number().default(3),
  }),

  // Step 3 — Scale factor
  scale: z.object({
    userBuckets: z.array(UserBucketSchema).min(1),
    langSlope: z.number().min(0),
  }),

  // Step 4 — Effort
  effort: z.object({
    productivity: z.number().positive(),
    scaleExponent: z.number().positive(),
    contingencyPct: z.number().min(0).max(1),
  }),

  // Step 5 — Phases (shares must sum to 1.0 ± 0.001)
  phases: z.array(PhaseSchema).min(1),

  // Step 6 — Roles (shares must sum to 1.0 ± 0.001)
  roles: z.array(RoleSchema).min(1),

  // Step 7 — Cost fallback
  blendedDailyRate: z.number().positive(),

  // Step 8 — Duration
  duration: z.object({
    productiveDaysPerMonth: z.number().positive(),
    scheduleFactor: z.number().positive(),
    scheduleExponent: z.number().positive(),
  }),

  // Step 9 — Uncertainty
  uncertaintyPct: z.number().min(0).max(1),
});

export type CalibrationProfile = z.infer<typeof CalibrationProfileSchema>;
