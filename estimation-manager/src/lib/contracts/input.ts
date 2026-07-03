import { z } from "zod";

export const ComplexitySchema = z.enum(["low", "medium", "high"]);
export type Complexity = z.infer<typeof ComplexitySchema>;

const CostDriverSchema = z.object({
  count: z.number().int().min(0),
  complexity: ComplexitySchema.default("medium"),
});

export const EstimationInputSchema = z.object({
  // 8 cost drivers
  drivers: z.object({
    masks: CostDriverSchema,
    useCases: CostDriverSchema,
    businessObjects: CostDriverSchema,
    interfaces: CostDriverSchema,
    batches: CostDriverSchema,
    roles: CostDriverSchema,
    // users and languages feed into the scale factor, not FP directly
    users: z.number().int().min(0).default(0),
    languages: z.number().int().min(1).default(1),
  }),

  // VAF factors: key → value 0–5, default 3 (neutral)
  factors: z.record(z.string(), z.number().min(0).max(5)).default({}),

  // Global project params
  teamSize: z.number().positive().optional(),
  currency: z.string().default("EUR"),
  contingencyPct: z.number().min(0).max(1).optional(),

  projectMeta: z
    .object({
      name: z.string(),
      client: z.string().optional(),
      description: z.string().optional(),
      tags: z.array(z.string()).optional(),
    })
    .optional(),
});

export type EstimationInput = z.infer<typeof EstimationInputSchema>;
