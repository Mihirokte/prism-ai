import { distance } from "fastest-levenshtein";

/**
 * Return the top N symbols from the list that are closest to the given name (by Levenshtein distance).
 */
export function fuzzyMatchSymbols(
  name: string,
  symbols: string[],
  topN = 3
): string[] {
  if (symbols.length === 0) return [];
  const withDist = symbols.map((s) => ({ s, d: distance(name, s) }));
  withDist.sort((a, b) => a.d - b.d);
  return withDist.slice(0, topN).map((x) => x.s);
}

/**
 * From GTR symbol keys (e.g. "file.ts:foo"), extract the suffix (symbol name) for fuzzy matching.
 */
export function getSymbolNamesFromGtr(gtr: { symbols: Record<string, unknown> }): string[] {
  return Object.keys(gtr.symbols).map((key) => {
    const i = key.lastIndexOf(":");
    return i >= 0 ? key.slice(i + 1) : key;
  });
}
