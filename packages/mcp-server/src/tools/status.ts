import { loadGtr, gtrHash, PRISM_VERSION } from "../lib/gtr.js";
import type { ToolCallback } from "../types.js";

export const prism_status: ToolCallback = async (args, { root }) => {
  const rootPath = (args as { root?: string }).root ?? root;
  const start = Date.now();
  const gtr = await loadGtr(rootPath);
  const duration_ms = Date.now() - start;
  if (!gtr) {
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
            metadata: { tool: "prism_status", duration_ms, prism_version: PRISM_VERSION },
          }),
        },
      ],
      isError: true,
    };
  }
  const fileCount = Object.keys(gtr.files).length;
  const symbolCount = Object.keys(gtr.symbols).length;
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          ok: true,
          data: {
            builtAt: gtr.builtAt,
            fileCount,
            symbolCount,
            gtr_hash: gtrHash(gtr),
          },
          metadata: {
            tool: "prism_status",
            duration_ms,
            gtr_hash: gtrHash(gtr),
            prism_version: PRISM_VERSION,
          },
        }),
      },
    ],
  };
};
