import type { Gtr } from "../schemas/gtr.js";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { estimateTokens } from "./tokenizer.js";
import { getBudget } from "./budget.js";

export interface BoundedContext {
  task: string;
  files: { path: string; content: string }[];
  totalTokens: number;
  truncated: boolean;
}

/**
 * Build bounded context by priority: task, direct refs, 1-hop deps, types, 2-hop.
 */
export async function buildBoundedContext(
  root: string,
  gtr: Gtr,
  taskDescription: string,
  options: {
    agentName?: string;
    maxFiles?: number;
    directRefs?: string[];
  } = {}
): Promise<BoundedContext> {
  const agentName = options.agentName ?? "default";
  const maxFiles = options.maxFiles ?? 15;
  const budget = getBudget(agentName);
  const directRefs = new Set(options.directRefs ?? []);

  const systemPrefix = `## Task\n${taskDescription}\n\nIMPORTANT: Only reference symbols, files, and packages listed in the above context. If you need information not present here, output CONTEXT_INSUFFICIENT:<reason> and stop.\n\n## Context\n`;
  let usedTokens = estimateTokens(systemPrefix);
  const included = new Set<string>();
  const result: { path: string; content: string }[] = [];

  function addFile(path: string): boolean {
    if (included.has(path) || result.length >= maxFiles) return false;
    included.add(path);
    return true;
  }

  for (const path of directRefs) {
    if (gtr.files[path] && addFile(path)) {
      try {
        const content = await readFile(join(root, path), "utf-8");
        const tokens = estimateTokens(content);
        if (usedTokens + tokens > budget) continue;
        usedTokens += tokens;
        result.push({ path, content });
      } catch {
        // skip
      }
    }
  }

  const oneHop = new Set<string>();
  for (const path of included) {
    const imports = gtr.imports[path];
    if (imports) {
      for (const imp of imports) {
        if (imp.from.startsWith(".")) {
          const base = path.includes("/") ? path.replace(/\/[^/]+$/, "") : "";
          const parts = [...base.split("/"), ...imp.from.split("/")].filter(Boolean);
          const out: string[] = [];
          for (const p of parts) {
            if (p === "..") out.pop();
            else if (p !== ".") out.push(p);
          }
          let joined = out.join("/");
          if (joined && !joined.match(/\.(ts|tsx|js|jsx|mjs|cjs)$/)) {
            const tried = [`${joined}.ts`, `${joined}.tsx`, `${joined}/index.ts`, `${joined}.js`];
            for (const t of tried) {
              if (gtr.files[t]) {
                oneHop.add(t);
                break;
              }
            }
          } else if (gtr.files[joined]) {
            oneHop.add(joined);
          }
        }
      }
    }
  }

  for (const path of oneHop) {
    if (!addFile(path)) break;
    try {
      const content = await readFile(join(root, path), "utf-8");
      const tokens = estimateTokens(content);
      if (usedTokens + tokens > budget) continue;
      usedTokens += tokens;
      result.push({ path, content });
    } catch {
      // skip
    }
  }

  for (const path of Object.keys(gtr.files)) {
    if (result.length >= maxFiles || usedTokens >= budget) break;
    if (included.has(path)) continue;
    if (!path.endsWith(".d.ts") && !path.includes("/types/")) continue;
    if (!addFile(path)) continue;
    try {
      const content = await readFile(join(root, path), "utf-8");
      const tokens = estimateTokens(content);
      if (usedTokens + tokens > budget) continue;
      usedTokens += tokens;
      result.push({ path, content });
    } catch {
      // skip
    }
  }

  const truncated = result.length >= maxFiles || usedTokens >= budget;
  return {
    task: taskDescription,
    files: result,
    totalTokens: usedTokens,
    truncated,
  };
}
