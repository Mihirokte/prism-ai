/**
 * Extract symbol and package references from a code string (e.g. agent output).
 * Uses regex patterns for import/require and identifier-like references.
 */

const IMPORT_PATTERN = /(?:import\s+.*?\s+from\s+['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;
const IDENT_PATTERN = /(?:^|[^\w.])([a-zA-Z_$][\w.]*)(?=\s*[(\[<;,:}])/g;

/**
 * Extract package names from import/require statements.
 */
export function extractPackageReferences(code: string): string[] {
  const packages = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(IMPORT_PATTERN.source, "g");
  while ((m = re.exec(code)) !== null) {
    const pkg = m[1] ?? m[2];
    if (pkg && !pkg.startsWith(".")) {
      const parts = pkg.split("/");
      const name = parts[0];
      if (name) {
        if (name.startsWith("@")) {
          const scoped = parts.slice(0, 2).join("/");
          packages.add(scoped);
        } else {
          packages.add(name);
        }
      }
    }
  }
  return [...packages];
}

/**
 * Extract possible symbol references (identifiers that look like property chains).
 */
export function extractSymbolReferences(code: string): string[] {
  const refs = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(IDENT_PATTERN.source, "g");
  while ((m = re.exec(code)) !== null) {
    const sym = m[1];
    if (sym && sym.length > 1 && !/^\d+$/.test(sym)) {
      refs.add(sym);
    }
  }
  return [...refs];
}
