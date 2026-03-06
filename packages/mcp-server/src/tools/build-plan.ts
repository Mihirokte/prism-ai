import { buildBoundedContext } from "@prism-ai/core";
import { loadGtr, gtrHash, PRISM_VERSION } from "../lib/gtr.js";
import type { ToolCallback } from "../types.js";

export const prism_build_plan: ToolCallback = async (args, { root }) => {
  const { task, agentName, maxFiles, directRefs } = args as {
    task?: string;
    agentName?: string;
    maxFiles?: number;
    directRefs?: string[];
  };
  const start = Date.now();
  const gtr = await loadGtr(root);
  if (!gtr) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: { code: "GTR_NOT_FOUND", message: "Run prism_init first." }, metadata: { tool: "prism_build_plan", duration_ms: Date.now() - start } }) }],
      isError: true,
    };
  }
  const context = await buildBoundedContext(root, gtr, task ?? "", {
    agentName,
    maxFiles,
    directRefs,
  });
  const duration_ms = Date.now() - start;
  const text =
    `## Task\n${context.task}\n\nIMPORTANT: Only reference symbols, files, and packages listed in the context below. If you need information not present here, output CONTEXT_INSUFFICIENT:<reason> and stop.\n\n## Context\n` +
    context.files.map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join("\n\n");
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          ok: true,
          data: { context: text, totalTokens: context.totalTokens, truncated: context.truncated, fileCount: context.files.length },
          metadata: { tool: "prism_build_plan", duration_ms, gtr_hash: gtrHash(gtr), prism_version: PRISM_VERSION },
        }),
      },
    ],
  };
};
