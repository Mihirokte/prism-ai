import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import ignore, { type Ignore } from "ignore";

const DEFAULT_IGNORE = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".turbo",
  "coverage",
  "*.min.js",
  ".prism",
];

export interface WalkOptions {
  root: string;
  /** Additional ignore patterns (gitignore-style) */
  ignorePatterns?: string[];
  /** Include .gitignore from root and merge with defaults */
  useGitignore?: boolean;
  /** File extensions to include (e.g. ['.ts', '.js', '.py']). If empty, include all. */
  extensions?: string[];
}

/**
 * Build an ignore filter from options and optional .gitignore content.
 */
export function createIgnoreFilter(options: WalkOptions): Ignore {
  const ig = ignore();
  ig.add(DEFAULT_IGNORE);
  if (options.ignorePatterns?.length) {
    ig.add(options.ignorePatterns);
  }
  return ig;
}

/**
 * Recursively walk directory and yield file paths (relative to root) that are not ignored.
 */
export async function* walkFiles(options: WalkOptions): AsyncGenerator<string> {
  const ig = createIgnoreFilter(options);
  if (options.useGitignore) {
    try {
      const gitignorePath = join(options.root, ".gitignore");
      const content = await readFile(gitignorePath, "utf-8");
      ig.add(content);
    } catch {
      // no .gitignore
    }
  }

  const extSet =
    options.extensions?.length ?? 0 > 0
      ? new Set(options.extensions!.map((e) => e.toLowerCase()))
      : null;

  async function* walk(dir: string): AsyncGenerator<string> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const ent of entries) {
      const full = join(dir, ent.name);
      const rel = relative(options.root, full).replace(/\\/g, "/");
      if (ig.ignores(rel)) continue;
      if (ent.isDirectory()) {
        yield* walk(full);
      } else if (ent.isFile()) {
        if (extSet) {
          const lower = ent.name.toLowerCase();
          const hasExt = [...extSet].some((e) => lower.endsWith(e));
          if (!hasExt) continue;
        }
        yield rel;
      }
    }
  }

  yield* walk(options.root);
}

/**
 * Collect all walked file paths into an array.
 */
export async function collectFiles(options: WalkOptions): Promise<string[]> {
  const out: string[] = [];
  for await (const rel of walkFiles(options)) {
    out.push(rel);
  }
  return out;
}
