import { buildGraphFromGtr, traceFrom } from "@prism-ai/core";
import { loadGtr, gtrHash, PRISM_VERSION } from "../lib/gtr.js";
import type { ToolCallback } from "../types.js";

export const prism_viz_trace: ToolCallback = async (args, { root }) => {
  const { root: rootArg, fileOrSymbol, depth } = args as {
    root?: string;
    fileOrSymbol?: string;
    depth?: number;
  };
  const rootPath = rootArg ?? root;
  const start = Date.now();
  const gtr = await loadGtr(rootPath);
  if (!gtr) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: { code: "GTR_NOT_FOUND", message: "Run prism_init first." }, metadata: { tool: "prism_viz_trace", duration_ms: Date.now() - start } }) }],
      isError: true,
    };
  }
  const graph = buildGraphFromGtr(gtr);
  const file = fileOrSymbol ?? "";
  const steps = traceFrom(graph, file, { depth: depth ?? 10 });
  const duration_ms = Date.now() - start;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          ok: true,
          data: { steps },
          metadata: { tool: "prism_viz_trace", duration_ms, gtr_hash: gtrHash(gtr), prism_version: PRISM_VERSION },
        }),
      },
    ],
  };
};
