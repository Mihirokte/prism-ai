import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Gtr, FileEntry } from "../schemas/gtr.js";
import type { SymbolEntry, ExportedSymbol, ResolvedImport } from "../schemas/symbols.js";
import { hashContent } from "./hasher.js";
import { writeJsonAtomic } from "./writer.js";
import { extractSymbols, langFromPath } from "../parser/extract.js";
import { getLanguage } from "../parser/init.js";
import { GtrSchema } from "../schemas/gtr.js";

export interface RefreshOptions {
  root: string;
  /** Current GTR (from gtr.json) */
  currentGtr: Gtr;
  /** Path to write updated gtr.json */
  outPath?: string;
}

/**
 * Incrementally update GTR: re-hash all files, re-parse only changed files,
 * update symbol/import/export maps for changed files only.
 */
export async function refreshGtr(options: RefreshOptions): Promise<Gtr> {
  const { root, currentGtr, outPath } = options;
  const files = Object.keys(currentGtr.files);
  const newFiles: Record<string, FileEntry> = { ...currentGtr.files };
  const newSymbols: Record<string, SymbolEntry> = { ...currentGtr.symbols };
  const newImports: Record<string, ResolvedImport[]> = { ...currentGtr.imports };
  const newExports: Record<string, ExportedSymbol[]> = { ...currentGtr.exports };

  for (const rel of files) {
    const full = join(root, rel);
    let content: string;
    try {
      content = await readFile(full, "utf-8");
    } catch {
      continue;
    }
    const newHash = await hashContent(content);
    const oldEntry = currentGtr.files[rel];
    if (oldEntry && oldEntry.hash === newHash) {
      newFiles[rel] = oldEntry;
      continue;
    }

    const statResult = await stat(full);
    const lang = langFromPath(rel);
    newFiles[rel] = {
      hash: newHash,
      mtime: Math.floor(statResult.mtimeMs),
      language: lang,
    };

    // Remove old symbols for this file (keys are file:name)
    for (const key of Object.keys(newSymbols)) {
      if (key.startsWith(`${rel}:`)) {
        delete newSymbols[key];
      }
    }
    delete newImports[rel];
    delete newExports[rel];

    const langId =
      lang === "typescript" ? "typescript" : lang === "javascript" ? "javascript" : lang === "python" ? "python" : "unknown";
    const language = langId !== "unknown" ? getLanguage(langId) : undefined;
    const extracted = extractSymbols(content, langId, rel, language ?? undefined);

    for (const [key, entry] of extracted.symbols) {
      newSymbols[key] = entry;
    }
    if (extracted.imports.length > 0) {
      newImports[rel] = extracted.imports;
    }
    if (extracted.exports.length > 0) {
      newExports[rel] = extracted.exports;
    }
  }

  const gtr: Gtr = {
    ...currentGtr,
    builtAt: new Date().toISOString(),
    files: newFiles,
    symbols: newSymbols,
    imports: newImports,
    exports: newExports,
  };

  const out = outPath ?? join(root, ".prism", "gtr.json");
  await writeJsonAtomic(out, gtr);

  return GtrSchema.parse(gtr);
}
