import type { Gtr } from "../schemas/gtr.js";
import type { SymbolEntry, ResolvedImport } from "../schemas/symbols.js";

/**
 * Look up a symbol by name (or by "filePath:name" key).
 */
export function lookupSymbol(gtr: Gtr, nameOrKey: string): SymbolEntry | undefined {
  if (gtr.symbols[nameOrKey]) {
    return gtr.symbols[nameOrKey];
  }
  for (const [key, entry] of Object.entries(gtr.symbols)) {
    if (key.endsWith(`:${nameOrKey}`)) return entry;
  }
  return undefined;
}

/**
 * Get all symbols defined in a file.
 */
export function getSymbolsInFile(gtr: Gtr, filePath: string): SymbolEntry[] {
  const prefix = `${filePath}:`;
  return Object.entries(gtr.symbols)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, entry]) => entry);
}

/**
 * Get imports for a file.
 */
export function getImports(gtr: Gtr, filePath: string): ResolvedImport[] {
  return gtr.imports[filePath] ?? [];
}

/**
 * Get exports for a file.
 */
export function getExports(gtr: Gtr, filePath: string) {
  return gtr.exports[filePath] ?? [];
}

/**
 * Resolve import "from" path to a file path relative to root (if local).
 */
export function resolveImportFrom(
  gtr: Gtr,
  filePath: string,
  from: string
): string | null {
  if (from.startsWith(".")) {
    const dir = filePath.includes("/") ? filePath.replace(/\/[^/]+$/, "") : "";
    const joined = joinPath(dir, from);
    return normalizedPath(joined);
  }
  return null;
}

function joinPath(dir: string, rel: string): string {
  if (!dir) return rel;
  const parts = [...dir.split("/"), ...rel.split("/")].filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (p === "..") {
      out.pop();
    } else if (p !== ".") {
      out.push(p);
    }
  }
  return out.join("/");
}

function normalizedPath(p: string): string {
  return p.replace(/^\/+/, "").replace(/\\/g, "/");
}

/**
 * Find all files that reference a given symbol name (via imports or direct ref).
 */
export function findReferences(gtr: Gtr, symbolName: string): string[] {
  const files = new Set<string>();
  for (const [file, imports] of Object.entries(gtr.imports)) {
    for (const imp of imports) {
      for (const s of imp.specifiers) {
        if (s.local === symbolName || s.imported === symbolName) {
          files.add(file);
        }
      }
    }
  }
  for (const [key] of Object.entries(gtr.symbols)) {
    if (key.endsWith(`:${symbolName}`)) {
      const entry = gtr.symbols[key];
      if (entry) files.add(entry.file);
    }
  }
  return [...files];
}
