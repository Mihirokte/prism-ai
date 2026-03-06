import type { DepGraph } from "./build.js";

export interface TraceStep {
  from: string;
  to: string;
  depth: number;
}

/**
 * Trace from a file (or symbol) through the dependency graph: follow out-edges with optional depth limit.
 */
export function traceFrom(
  graph: DepGraph,
  startFile: string,
  options: { depth?: number; direction?: "out" | "in" } = {}
): TraceStep[] {
  const { depth = 10, direction = "out" } = options;
  const steps: TraceStep[] = [];
  const visited = new Set<string>();

  function visit(node: string, d: number) {
    if (d > depth) return;
    if (visited.has(node)) return;
    visited.add(node);
    const neighbors = direction === "out" ? graph.outNeighbors(node) : graph.inNeighbors(node);
    for (const w of neighbors) {
      steps.push({
        from: direction === "out" ? node : w,
        to: direction === "out" ? w : node,
        depth: d,
      });
      visit(w, d + 1);
    }
  }

  if (graph.hasNode(startFile)) {
    visit(startFile, 0);
  }
  return steps;
}

/**
 * Get the path from start to target (BFS).
 */
export function findPath(
  graph: DepGraph,
  startFile: string,
  targetFile: string
): string[] | null {
  if (!graph.hasNode(startFile) || !graph.hasNode(targetFile)) return null;
  const queue: { node: string; path: string[] }[] = [{ node: startFile, path: [startFile] }];
  const visited = new Set<string>([startFile]);

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;
    if (node === targetFile) return path;
    for (const w of graph.outNeighbors(node)) {
      if (!visited.has(w)) {
        visited.add(w);
        queue.push({ node: w, path: [...path, w] });
      }
    }
  }
  return null;
}
