import type { Gtr } from "../schemas/gtr.js";
import type { ValidationResult } from "../schemas/validation.js";
import { extractSymbolReferences, extractPackageReferences } from "./extract.js";
import { fuzzyMatchSymbols, getSymbolNamesFromGtr } from "./fuzzy.js";

/**
 * Validate agent output against the GTR: all referenced symbols and packages must exist.
 */
export function validateOutput(output: string, gtr: Gtr): ValidationResult {
  const refSymbols = extractSymbolReferences(output);
  const refPackages = extractPackageReferences(output);

  const knownSymbolNames = new Set(
    Object.keys(gtr.symbols).flatMap((key) => {
      const i = key.lastIndexOf(":");
      return i >= 0 ? [key, key.slice(i + 1)] : [key];
    })
  );
  const knownPackages = new Set([
    ...Object.keys(gtr.deps.dependencies ?? {}),
    ...Object.keys(gtr.deps.devDependencies ?? {}),
    ...Object.keys(gtr.deps.peerDependencies ?? {}),
  ]);

  const unknownSymbols: string[] = [];
  for (const sym of refSymbols) {
    const base = sym.split(".")[0];
    if (base && !knownSymbolNames.has(sym) && !knownSymbolNames.has(base)) {
      unknownSymbols.push(sym);
    }
  }
  const unknownPackages = refPackages.filter((p) => !knownPackages.has(p));

  if (unknownSymbols.length === 0 && unknownPackages.length === 0) {
    return { valid: true };
  }

  return {
    valid: false,
    action: "REJECT_AND_RETRY_WITH_CORRECTION",
    hallucinations: {
      symbols: unknownSymbols,
      packages: unknownPackages,
    },
  };
}

/**
 * Get fuzzy correction suggestions for unknown symbols (top 3 closest from GTR).
 */
export function getCorrectionSuggestions(
  unknownSymbols: string[],
  gtr: Gtr,
  topN = 3
): Record<string, string[]> {
  const allNames = getSymbolNamesFromGtr(gtr);
  const out: Record<string, string[]> = {};
  for (const sym of unknownSymbols) {
    out[sym] = fuzzyMatchSymbols(sym, allNames, topN);
  }
  return out;
}
