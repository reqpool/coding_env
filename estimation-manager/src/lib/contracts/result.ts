import { z } from "zod";

const BandSchema = z.object({
  low: z.number(),
  expected: z.number(),
  high: z.number(),
});

const PhaseResultSchema = z.object({
  name: z.string(),
  share: z.number(),
  effortPD: z.number(),
});

const RoleResultSchema = z.object({
  name: z.string(),
  share: z.number(),
  effortPD: z.number(),
  cost: z.number(),
  dailyRate: z.number(),
});

const DurationResultSchema = z.object({
  capacityMonths: z.number().optional(),
  nominalMonths: z.number(),
  durationMonths: z.number(),
});

export const EstimationResultSchema = z.object({
  engineVersion: z.string(),
  profileId: z.string().optional(),
  profileVersion: z.number().int(),

  // Intermediate values (for transparent calculation breakdown)
  rawFP: z.number(),
  vaf: z.number(),
  adjustedFP: z.number(),
  scaleFactor: z.number(),

  // Core outputs with uncertainty bands
  effortPD: BandSchema,
  totalCost: BandSchema,
  duration: DurationResultSchema,

  // Breakdowns
  phases: z.array(PhaseResultSchema),
  roles: z.array(RoleResultSchema),

  // Dimension analysis (share of effort per dimension)
  dimensions: z.object({
    functionality: z.number(),
    integration: z.number(),
    complexity: z.number(),
    scalability: z.number(),
  }),

  currency: z.string(),
});

export type EstimationResult = z.infer<typeof EstimationResultSchema>;
