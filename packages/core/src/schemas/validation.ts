import { z } from "zod";

/** Confidence block attached to PRISM outputs */
export const ConfidenceBlockSchema = z.object({
  score: z.number().min(0).max(1),
  grounded_symbols: z.number().int().nonnegative(),
  total_symbols_referenced: z.number().int().nonnegative(),
  unverified_count: z.number().int().nonnegative(),
  unverified_list: z.array(z.string()),
  warning: z.string().optional(),
});
export type ConfidenceBlock = z.infer<typeof ConfidenceBlockSchema>;

/** Result of symbol validation (Layer 2) */
export const ValidationResultSchema = z.discriminatedUnion("valid", [
  z.object({
    valid: z.literal(true),
  }),
  z.object({
    valid: z.literal(false),
    action: z.literal("REJECT_AND_RETRY_WITH_CORRECTION"),
    hallucinations: z.object({
      symbols: z.array(z.string()),
      packages: z.array(z.string()),
    }),
  }),
]);
export type ValidationResult = z.infer<typeof ValidationResultSchema>;
