import { describe, it, expect } from "vitest";
import {
  validateOutput,
  extractSymbolReferences,
  extractPackageReferences,
  buildConfidenceBlock,
  getCorrectionSuggestions,
} from "../src/index.js";
import type { Gtr } from "../src/schemas/gtr.js";

const mockGtr: Gtr = {
  version: 1,
  root: "/repo",
  files: { "src/foo.ts": { hash: "x", mtime: 0, language: "typescript" } },
  symbols: {
    "src/foo.ts:bar": { kind: "function", file: "src/foo.ts", line: 1, exported: true },
    "src/foo.ts:baz": { kind: "class", file: "src/foo.ts", line: 5, exported: true },
  },
  imports: {},
  exports: { "src/foo.ts": [{ name: "bar", kind: "function", line: 1 }] },
  deps: { dependencies: { lodash: "^4.0.0" } },
};

describe("Validator", () => {
  it("extractSymbolReferences finds identifiers", () => {
    const code = "const x = bar(); baz.method();";
    const refs = extractSymbolReferences(code);
    expect(refs).toContain("bar");
    expect(refs.some((r) => r.includes("baz"))).toBe(true);
  });

  it("extractPackageReferences finds import/require", () => {
    const code = 'import _ from "lodash"; const x = require("chalk");';
    const refs = extractPackageReferences(code);
    expect(refs).toContain("lodash");
    expect(refs).toContain("chalk");
  });

  it("validateOutput returns valid when symbols exist in GTR", () => {
    const result = validateOutput("bar(); baz();", mockGtr);
    expect(result.valid).toBe(true);
  });

  it("validateOutput returns invalid when package not in GTR", () => {
    const result = validateOutput('import x from "unknown-pkg";', mockGtr);
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.hallucinations.packages).toContain("unknown-pkg");
    }
  });

  it("buildConfidenceBlock returns correct shape", () => {
    const block = buildConfidenceBlock(10, 12, ["a", "b"], []);
    expect(block.score).toBeLessThanOrEqual(1);
    expect(block.grounded_symbols).toBe(10);
    expect(block.total_symbols_referenced).toBe(12);
    expect(block.unverified_count).toBe(2);
    expect(block.unverified_list).toContain("a");
  });

  it("getCorrectionSuggestions returns fuzzy matches", () => {
    const suggestions = getCorrectionSuggestions(["bar", "unknown"], mockGtr, 2);
    expect(suggestions["bar"]?.length).toBeGreaterThanOrEqual(0);
    expect(suggestions["unknown"]?.length).toBeGreaterThanOrEqual(0);
  });
});
