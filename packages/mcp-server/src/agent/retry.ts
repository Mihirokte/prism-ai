import { getCorrectionSuggestions } from "@prism-ai/core";
import type { Gtr } from "@prism-ai/core";
import type { ValidationResult } from "@prism-ai/core";

const MAX_RETRIES = 2;

/**
 * Build a correction prompt for the agent when hallucinated symbols are detected.
 */
export function buildCorrectionPrompt(
  result: ValidationResult & { valid: false },
  gtr: Gtr
): string {
  const suggestions = getCorrectionSuggestions(result.hallucinations.symbols, gtr, 3);
  const lines: string[] = [
    "You referenced the following symbols which do not exist in this codebase:",
    ...result.hallucinations.symbols.map((s) => `- ${s}`),
    "",
    "Use only real symbols. Closest existing symbols (fuzzy match):",
  ];
  for (const [sym, tops] of Object.entries(suggestions)) {
    lines.push(`  ${sym} → ${tops.join(", ") || "(none)"}`);
  }
  if (result.hallucinations.packages.length > 0) {
    lines.push("", "Unknown packages referenced:", ...result.hallucinations.packages.map((p) => `- ${p}`));
  }
  lines.push("", "Revise your output using only symbols and packages from the context above.");
  return lines.join("\n");
}

/**
 * Retry protocol: maximum MAX_RETRIES (2) correction attempts.
 */
export function shouldRetry(attempt: number): boolean {
  return attempt < MAX_RETRIES;
}
