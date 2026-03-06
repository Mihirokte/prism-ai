import { buildGraphFromGtr, findDeadCode } from "@prism-ai/core";
import { loadGtr, gtrHash, PRISM_VERSION } from "../lib/gtr.js";
import type { ToolCallback } from "../types.js";

export const prism_viz_deadcode: ToolCallback = async (_args, { root }) => {
  const start = Date.now();
  const gtr = await loadGtr(root);
  if (!gtr) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: { code: "GTR_NOT_FOUND", message: "Run prism_init first." }, metadata: { tool: "prism_viz_deadcode", duration_ms: Date.now() - start } }) }],
      isError: true,
    };
  }
  buildGraphFromGtr(gtr);
  const dead = findDeadCode(gtr);
  const duration_ms = Date.now() - start;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          ok: true,
          data: { deadCode: dead },
          metadata: { tool: "prism_viz_deadcode", duration_ms, gtr_hash: gtrHash(gtr), prism_version: PRISM_VERSION },
        }),
      },
    ],
  };
};
