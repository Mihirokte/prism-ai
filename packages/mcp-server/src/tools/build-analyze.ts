import { buildGraphFromGtr, couplingScore, findCircularDependencies, findDeadCode } from "@prism-ai/core";
import { loadGtr, gtrHash, PRISM_VERSION } from "../lib/gtr.js";
import type { ToolCallback } from "../types.js";

export const prism_build_analyze: ToolCallback = async (_args, { root }) => {
  const start = Date.now();
  const gtr = await loadGtr(root);
  if (!gtr) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: { code: "GTR_NOT_FOUND", message: "Run prism_init first." }, metadata: { tool: "prism_build_analyze", duration_ms: Date.now() - start } }) }],
      isError: true,
    };
  }
  const graph = buildGraphFromGtr(gtr);
  const cycles = findCircularDependencies(graph);
  const dead = findDeadCode(gtr);
  const scores: Record<string, number> = {};
  for (const node of graph.nodes()) {
    scores[node] = couplingScore(graph, node);
  }
  const duration_ms = Date.now() - start;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          ok: true,
          data: { cycles, deadCode: dead, couplingScores: scores },
          metadata: { tool: "prism_build_analyze", duration_ms, gtr_hash: gtrHash(gtr), prism_version: PRISM_VERSION },
        }),
      },
    ],
  };
};
