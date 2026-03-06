import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Gtr, FileEntry, ResolvedManifest } from "../schemas/gtr.js";
import type { SymbolEntry, ExportedSymbol, ResolvedImport } from "../schemas/symbols.js";
import { collectFiles, type WalkOptions } from "./walker.js";
import { hashFile } from "./hasher.js";
import { writeJsonAtomic } from "./writer.js";
import { extractSymbols, langFromPath } from "../parser/extract.js";
import { getLanguage, initParser, loadLanguageFromPath } from "../parser/init.js";

export interface BuildGtrOptions extends WalkOptions {
  /** Path to write gtr.json (default: root/.prism/gtr.json) */
  outPath?: string;
  /** Optional map of langId -> path to .wasm. If not set, parsing is skipped for unsupported files. */
  wasmPaths?: Record<string, string>;
}

const DEFAULT_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".py"];

/**
 * Build the Ground Truth Registry for the given root directory.
 */
export async function buildGtr(options: BuildGtrOptions): Promise<Gtr> {
  await initParser();

  const root = options.root;
  const walkOpts: WalkOptions = {
    ...options,
    useGitignore: options.useGitignore ?? true,
    extensions: options.extensions ?? DEFAULT_EXTENSIONS,
  };

  const files = await collectFiles(walkOpts);
  const filesMap: Record<string, FileEntry> = {};
  const symbolsMap: Record<string, SymbolEntry> = {};
  const importsMap: Record<string, ResolvedImport[]> = {};
  const exportsMap: Record<string, ExportedSymbol[]> = {};

  const wasmPaths = options.wasmPaths ?? {};
  for (const [langId, path] of Object.entries(wasmPaths)) {
    await loadLanguageFromPath(langId, path);
  }

  for (const rel of files) {
    const full = join(root, rel);
    let statResult: { mtimeMs: number } | null = null;
    try {
      statResult = await stat(full);
    } catch {
      continue;
    }
    const content = await readFile(full, "utf-8").catch(() => "");
    const hash = await hashFile(root, rel);
    const lang = langFromPath(rel);
    filesMap[rel] = {
      hash,
      mtime: Math.floor(statResult.mtimeMs),
      language: lang,
    };

    const langId =
      lang === "typescript" ? "typescript" : lang === "javascript" ? "javascript" : lang === "python" ? "python" : "unknown";
    const language = langId !== "unknown" ? getLanguage(langId) : undefined;
    const extracted = extractSymbols(content, langId, rel, language ?? undefined);

    for (const [key, entry] of extracted.symbols) {
      symbolsMap[key] = entry;
    }
    if (extracted.imports.length > 0) {
      importsMap[rel] = extracted.imports;
    }
    if (extracted.exports.length > 0) {
      exportsMap[rel] = extracted.exports;
    }
  }

  const deps = await resolveManifest(root);

  const gtr: Gtr = {
    version: 1,
    builtAt: new Date().toISOString(),
    root,
    files: filesMap,
    symbols: symbolsMap,
    imports: importsMap,
    exports: exportsMap,
    deps,
  };

  const outPath = options.outPath ?? join(root, ".prism", "gtr.json");
  await writeJsonAtomic(outPath, gtr);

  return gtr;
}

async function resolveManifest(root: string): Promise<ResolvedManifest> {
  const pkgPath = join(root, "package.json");
  try {
    const raw = await readFile(pkgPath, "utf-8");
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    return {
      dependencies: pkg.dependencies ?? {},
      devDependencies: pkg.devDependencies,
      peerDependencies: pkg.peerDependencies,
    };
  } catch {
    return { dependencies: {} };
  }
}
