import { refreshGtr } from "@prism-ai/core";
import { loadGtr } from "../lib/gtr.js";
import { getGtrPath } from "../lib/gtr.js";
import type { ToolCallback } from "../types.js";

export const prism_refresh: ToolCallback = async (args, { root }) => {
  const rootPath = (args as { root?: string }).root ?? root;
  const start = Date.now();
  const current = await loadGtr(rootPath);
  if (!current) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ok: false,
            error: {
              code: "GTR_NOT_FOUND",
              message: "GTR not found. Run prism_init first.",
              suggestion: "Call prism_init to index the repository.",
            },
            metadata: { tool: "prism_refresh", duration_ms: Date.now() - start },
          }),
        },
      ],
      isError: true,
    };
  }
  try {
    await refreshGtr({
      root: rootPath,
      currentGtr: current,
      outPath: getGtrPath(rootPath),
    });
    const duration_ms = Date.now() - start;
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ok: true,
            message: "GTR refreshed",
            metadata: { tool: "prism_refresh", duration_ms },
          }),
        },
      ],
    };
  } catch (err) {
    const duration_ms = Date.now() - start;
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ok: false,
            error: {
              code: "GTR_REFRESH_FAILED",
              message: err instanceof Error ? err.message : String(err),
              suggestion: "Run prism_init to rebuild from scratch if needed.",
            },
            metadata: { tool: "prism_refresh", duration_ms },
          }),
        },
      ],
      isError: true,
    };
  }
};
