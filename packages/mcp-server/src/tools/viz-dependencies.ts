import { buildGraphFromGtr, getImports, getExports } from "@prism-ai/core";
import { loadGtr, gtrHash, PRISM_VERSION } from "../lib/gtr.js";
import type { ToolCallback } from "../types.js";

export const prism_viz_dependencies: ToolCallback = async (args, { root }) => {
  const { root: rootArg, file } = args as { root?: string; file?: string };
  const rootPath = rootArg ?? root;
  const start = Date.now();
  const gtr = await loadGtr(rootPath);
  if (!gtr) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: { code: "GTR_NOT_FOUND", message: "Run prism_init first." }, metadata: { tool: "prism_viz_dependencies", duration_ms: Date.now() - start } }) }],
      isError: true,
    };
  }
  buildGraphFromGtr(gtr);
  const imports = file ? getImports(gtr, file) : [];
  const exports = file ? getExports(gtr, file) : [];
  const duration_ms = Date.now() - start;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          ok: true,
          data: {
            imports,
            exports,
            suggestion: "Run command: PRISM: VIZ Dependencies (Current File)",
          },
          metadata: { tool: "prism_viz_dependencies", duration_ms, gtr_hash: gtrHash(gtr), prism_version: PRISM_VERSION },
        }),
      },
    ],
  };
};
