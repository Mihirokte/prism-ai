import type { ConfidenceBlock } from "../schemas/validation.js";

/**
 * Build a confidence block from validation counts.
 */
export function buildConfidenceBlock(
  groundedSymbols: number,
  totalReferenced: number,
  unverifiedSymbols: string[],
  unverifiedPackages: string[] = []
): ConfidenceBlock {
  const unverified = [...unverifiedSymbols, ...unverifiedPackages];
  const unverifiedCount = unverified.length;
  const score = totalReferenced > 0 ? Math.max(0, 1 - unverifiedCount / totalReferenced) : 1;
  const warning =
    unverifiedCount > 0
      ? `${unverifiedCount} symbol(s) unverified against GTR. Review before applying.`
      : undefined;
  return {
    score: Math.round(score * 100) / 100,
    grounded_symbols: groundedSymbols,
    total_symbols_referenced: totalReferenced,
    unverified_count: unverifiedCount,
    unverified_list: unverified,
    warning,
  };
}
