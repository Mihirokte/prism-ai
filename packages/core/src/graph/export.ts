import type { DepGraph } from "./build.js";

/**
 * Export the graph as a Mermaid flowchart string.
 */
export function toMermaid(graph: DepGraph, _title = "Dependency Graph"): string {
  const lines: string[] = ["flowchart LR"];
  const nodeIds = new Map<string, string>();
  let id = 0;
  graph.forEachNode((node: string) => {
    const nid = `N${id++}`;
    nodeIds.set(node, nid);
    const label = node.replace(/"/g, "#quot;");
    lines.push(`  ${nid}["${label}"]`);
  });
  graph.forEachEdge((_edge: string, _attr: unknown, source: string, target: string) => {
    const a = nodeIds.get(source);
    const b = nodeIds.get(target);
    if (a && b) {
      lines.push(`  ${a} --> ${b}`);
    }
  });
  return lines.join("\n");
}

/**
 * Export the graph as JSON (nodes and edges).
 */
export function toJson(graph: DepGraph): { nodes: string[]; edges: [string, string][] } {
  const nodes = graph.nodes();
  const edges: [string, string][] = [];
  graph.forEachEdge((_edge: string, _attr: unknown, source: string, target: string) => {
    edges.push([source, target]);
  });
  return { nodes: [...nodes], edges };
}
