import { buildGraphFromGtr, toJson, findCircularDependencies } from "@prism-ai/core";
import { loadGtr, gtrHash, PRISM_VERSION } from "../lib/gtr.js";
import type { ToolCallback } from "../types.js";

export const prism_viz_overview: ToolCallback = async (args, { root }) => {
  const rootPath = (args as { root?: string }).root ?? root;
  const start = Date.now();
  const gtr = await loadGtr(rootPath);
  if (!gtr) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: { code: "GTR_NOT_FOUND", message: "Run prism_init first." }, metadata: { tool: "prism_viz_overview", duration_ms: Date.now() - start } }) }],
      isError: true,
    };
  }
  const graph = buildGraphFromGtr(gtr);
  const json = toJson(graph);
  const cycles = findCircularDependencies(graph);
  const duration_ms = Date.now() - start;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          ok: true,
          data: {
            graph: json,
            cycles,
            suggestion: "Run command: PRISM: VIZ Overview",
          },
          metadata: { tool: "prism_viz_overview", duration_ms, gtr_hash: gtrHash(gtr), prism_version: PRISM_VERSION },
        }),
      },
    ],
  };
};
