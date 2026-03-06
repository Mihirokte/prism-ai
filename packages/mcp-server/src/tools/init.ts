import { buildGtr } from "@prism-ai/core";
import { getGtrPath } from "../lib/gtr.js";
import type { ToolCallback } from "../types.js";

export const prism_init: ToolCallback = async (args, { root }) => {
  const rootPath = (args as { root?: string }).root ?? root;
  const start = Date.now();
  try {
    await buildGtr({
      root: rootPath,
      useGitignore: true,
      outPath: getGtrPath(rootPath),
    });
    const duration_ms = Date.now() - start;
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ok: true,
            message: "GTR built successfully",
            metadata: { tool: "prism_init", duration_ms, prism_version: "0.1.0" },
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
              code: "GTR_BUILD_FAILED",
              message: err instanceof Error ? err.message : String(err),
              suggestion: "Check that the root path exists and is readable.",
            },
            metadata: { tool: "prism_init", duration_ms },
          }),
        },
      ],
      isError: true,
    };
  }
};
