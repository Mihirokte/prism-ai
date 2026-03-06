import { z } from "zod";
import { ConfidenceBlockSchema } from "./validation.js";

/** Error payload in PrismResponse */
export const PrismErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  suggestion: z.string(),
});
export type PrismError = z.infer<typeof PrismErrorSchema>;

/** Metadata present on every PRISM response */
export const PrismMetadataSchema = z.object({
  tool: z.string(),
  duration_ms: z.number().nonnegative(),
  gtr_hash: z.string(),
  prism_version: z.string(),
});
export type PrismMetadata = z.infer<typeof PrismMetadataSchema>;

/** Generic PRISM response envelope */
export function PrismResponseSchema<T extends z.ZodType>(dataSchema: T) {
  return z.object({
    ok: z.boolean(),
    data: dataSchema.optional(),
    error: PrismErrorSchema.optional(),
    confidence: ConfidenceBlockSchema.optional(),
    metadata: PrismMetadataSchema,
  });
}

export type PrismResponse<T> = {
  ok: boolean;
  data?: T;
  error?: z.infer<typeof PrismErrorSchema>;
  confidence?: z.infer<typeof ConfidenceBlockSchema>;
  metadata: z.infer<typeof PrismMetadataSchema>;
};
