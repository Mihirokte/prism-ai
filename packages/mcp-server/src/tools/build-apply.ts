import { loadGtr, gtrHash, PRISM_VERSION } from "../lib/gtr.js";
import type { ToolCallback } from "../types.js";

export const prism_build_apply: ToolCallback = async (args, { root }) => {
  const { patch, preview } = args as { patch?: string; preview?: boolean };
  const start = Date.now();
  const gtr = await loadGtr(root);
  if (!gtr) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: { code: "GTR_NOT_FOUND", message: "Run prism_init first." }, metadata: { tool: "prism_build_apply", duration_ms: Date.now() - start } }) }],
      isError: true,
    };
  }
  const duration_ms = Date.now() - start;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          ok: true,
          data: { message: preview !== false ? "Patch preview only (apply not implemented in this build). Pass preview: false to apply." : "Apply not implemented.", patchPreview: patch?.slice(0, 500) },
          metadata: { tool: "prism_build_apply", duration_ms, gtr_hash: gtrHash(gtr), prism_version: PRISM_VERSION },
        }),
      },
    ],
  };
};
