import { DirectedGraph } from "graphology";
import type { Gtr } from "../schemas/gtr.js";

export type DepGraph = DirectedGraph;

/**
 * Build a directed graph from GTR: nodes are file paths, edges are imports (A -> B means A imports from B).
 */
export function buildGraphFromGtr(gtr: Gtr): DepGraph {
  const graph = new DirectedGraph();

  for (const file of Object.keys(gtr.files)) {
    if (!graph.hasNode(file)) {
      graph.addNode(file, { path: file });
    }
  }

  for (const [file, imports] of Object.entries(gtr.imports)) {
    if (!graph.hasNode(file)) {
      graph.addNode(file, { path: file });
    }
    for (const imp of imports) {
      const from = imp.from;
      if (!from || !from.startsWith(".")) {
        continue;
      }
      const resolved = resolveToFile(gtr, file, from);
      if (resolved && gtr.files[resolved]) {
        if (!graph.hasNode(resolved)) {
          graph.addNode(resolved, { path: resolved });
        }
        if (!graph.hasEdge(file, resolved)) {
          graph.addEdge(file, resolved, { weight: 1 });
        }
      }
    }
  }

  return graph;
}

function resolveToFile(gtr: Gtr, fromFile: string, spec: string): string | null {
  if (!spec.startsWith(".")) return null;
  const base = fromFile.includes("/") ? fromFile.replace(/\/[^/]+$/, "") : "";
  const parts = [...base.split("/"), ...spec.split("/")].filter(Boolean);
  const out: string[] = [];
  for (const p of parts) {
    if (p === "..") out.pop();
    else if (p !== ".") out.push(p);
  }
  let joined = out.join("/");
  if (joined && !joined.match(/\.(ts|tsx|js|jsx|mjs|cjs|py)$/)) {
    const tried = [`${joined}.ts`, `${joined}.tsx`, `${joined}/index.ts`, `${joined}/index.tsx`, `${joined}.js`, `${joined}/index.js`];
    for (const t of tried) {
      if (gtr.files[t]) return t;
    }
    return joined + ".ts";
  }
  return joined || null;
}
