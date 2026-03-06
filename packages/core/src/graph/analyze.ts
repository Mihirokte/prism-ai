import type { DepGraph } from "./build.js";
import { hasCycle } from "graphology-dag";

export interface CircularDepsResult {
  hasCycle: boolean;
  cycles: string[][];
}

/**
 * Find one cycle in the graph using DFS (back edge).
 */
function findOneCycle(graph: DepGraph): string[] | null {
  const visited = new Set<string>();
  const stack: string[] = [];
  const indexInStack = new Map<string, number>();

  function dfs(node: string): string[] | null {
    const idx = stack.length;
    indexInStack.set(node, idx);
    stack.push(node);
    visited.add(node);

    for (const w of graph.outNeighbors(node)) {
      if (!visited.has(w)) {
        const cycle = dfs(w);
        if (cycle) return cycle;
      } else if (indexInStack.has(w)) {
        const start = indexInStack.get(w)!;
        return [...stack.slice(start), w];
      }
    }
    stack.pop();
    indexInStack.delete(node);
    return null;
  }

  for (const node of graph.nodes()) {
    if (visited.has(node)) continue;
    const cycle = dfs(node);
    if (cycle) return cycle;
  }
  return null;
}

/**
 * Find all cycles in the dependency graph.
 */
export function findCircularDependencies(graph: DepGraph): CircularDepsResult {
  if (!hasCycle(graph)) {
    return { hasCycle: false, cycles: [] };
  }
  const cycles: string[][] = [];
  let g = graph;
  let cycle = findOneCycle(g);
  while (cycle && cycle.length > 0) {
    cycles.push(cycle);
    const g2 = g.copy();
    for (let i = 0; i < cycle.length - 1; i++) {
      if (g2.hasEdge(cycle[i], cycle[i + 1])) {
        g2.dropEdge(cycle[i], cycle[i + 1]);
        break;
      }
    }
    if (!hasCycle(g2)) break;
    g = g2;
    cycle = findOneCycle(g);
  }
  return { hasCycle: true, cycles };
}

/**
 * Compute coupling score for a node (out-degree + in-degree).
 */
export function couplingScore(graph: DepGraph, node: string): number {
  return graph.inDegree(node) + graph.outDegree(node);
}

/**
 * Dead code: exports that are never imported by any other file.
 * Uses GTR exports and imports; only local (relative) imports count toward "referenced".
 */
export function findDeadCode(
  gtr: { files: Record<string, unknown>; exports: Record<string, { name: string }[]>; imports: Record<string, { from: string; specifiers: { local: string; imported?: string }[] }[]> }
): { file: string; exportName: string }[] {
  const referenced = new Set<string>();
  const resolve = (fromFile: string, fromSpec: string): string | null => {
    if (!fromSpec.startsWith(".")) return null;
    const base = fromFile.includes("/") ? fromFile.replace(/\/[^/]+$/, "") : "";
    const parts = [...base.split("/"), ...fromSpec.split("/")].filter(Boolean);
    const out: string[] = [];
    for (const p of parts) {
      if (p === "..") out.pop();
      else if (p !== ".") out.push(p);
    }
    let joined = out.join("/");
    if (joined && !joined.match(/\.(ts|tsx|js|jsx|mjs|cjs)$/)) {
      const tried = [`${joined}.ts`, `${joined}.tsx`, `${joined}/index.ts`, `${joined}.js`, `${joined}/index.js`];
      for (const t of tried) {
        if (gtr.files[t]) return t;
      }
    }
    return joined || null;
  };

  for (const [file, imports] of Object.entries(gtr.imports)) {
    for (const imp of imports) {
      const resolved = resolve(file, imp.from);
      if (resolved) {
        for (const s of imp.specifiers) {
          referenced.add(`${resolved}:${s.imported ?? s.local}`);
        }
      }
    }
  }

  const dead: { file: string; exportName: string }[] = [];
  for (const [file, exports] of Object.entries(gtr.exports)) {
    for (const e of exports) {
      if (!referenced.has(`${file}:${e.name}`)) {
        dead.push({ file, exportName: e.name });
      }
    }
  }
  return dead;
}
