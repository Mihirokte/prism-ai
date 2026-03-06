import { describe, it, expect, beforeAll } from "vitest";
import { buildGtr, refreshGtr, lookupSymbol, getSymbolsInFile, getImports } from "../src/index.js";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const dir = join(fileURLToPath(import.meta.url), "..", "fixtures", "mini-ts");

describe("GTR", () => {
  let gtr: Awaited<ReturnType<typeof buildGtr>>;

  beforeAll(async () => {
    gtr = await buildGtr({
      root: dir,
      useGitignore: true,
      extensions: [".ts", ".js"],
      outPath: join(dir, ".prism", "gtr.json"),
    });
  }, 30_000);

  it("builds GTR with files", () => {
    expect(gtr.root).toBe(dir);
    expect(Object.keys(gtr.files).length).toBeGreaterThanOrEqual(1);
  });

  it("lookupSymbol finds symbol when GTR has symbols", () => {
    const symbolCount = Object.keys(gtr.symbols).length;
    if (symbolCount > 0) {
      const firstKey = Object.keys(gtr.symbols)[0];
      const name = firstKey?.includes(":") ? firstKey.split(":").pop() : firstKey;
      const entry = name ? lookupSymbol(gtr, name) : undefined;
      expect(entry).toBeDefined();
    }
  });

  it("getSymbolsInFile returns symbols for a file", () => {
    const firstFile = Object.keys(gtr.files)[0];
    if (firstFile) {
      const symbols = getSymbolsInFile(gtr, firstFile);
      expect(Array.isArray(symbols)).toBe(true);
    }
  });

  it("getImports returns imports for a file", () => {
    const fileWithImports = Object.keys(gtr.imports)[0] ?? Object.keys(gtr.files)[0];
    if (fileWithImports) {
      const imports = getImports(gtr, fileWithImports);
      expect(Array.isArray(imports)).toBe(true);
    }
  });

  it("refreshGtr updates without error", async () => {
    const updated = await refreshGtr({
      root: dir,
      currentGtr: gtr,
      outPath: join(dir, ".prism", "gtr.json"),
    });
    expect(updated.files).toBeDefined();
    expect(updated.symbols).toBeDefined();
  });
});
