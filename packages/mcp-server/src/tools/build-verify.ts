import { validateOutput, getCorrectionSuggestions, buildConfidenceBlock } from "@prism-ai/core";
import { loadGtr, gtrHash, PRISM_VERSION } from "../lib/gtr.js";
import type { ToolCallback } from "../types.js";

export const prism_build_verify: ToolCallback = async (args, { root }) => {
  const { code } = args as { code?: string };
  const start = Date.now();
  const gtr = await loadGtr(root);
  if (!gtr) {
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ ok: false, error: { code: "GTR_NOT_FOUND", message: "Run prism_init first." }, metadata: { tool: "prism_build_verify", duration_ms: Date.now() - start } }) }],
      isError: true,
    };
  }
  const output = code ?? "";
  const result = validateOutput(output, gtr);
  const duration_ms = Date.now() - start;
  if (result.valid) {
    const total = output.length;
    const confidence = buildConfidenceBlock(total, total, [], []);
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            ok: true,
            data: { valid: true },
            confidence,
            metadata: { tool: "prism_build_verify", duration_ms, gtr_hash: gtrHash(gtr), prism_version: PRISM_VERSION },
          }),
        },
      ],
    };
  }
  const suggestions = getCorrectionSuggestions(result.hallucinations.symbols, gtr, 3);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({
          ok: true,
          data: { valid: false, hallucinations: result.hallucinations, suggestions },
          metadata: { tool: "prism_build_verify", duration_ms, gtr_hash: gtrHash(gtr), prism_version: PRISM_VERSION },
        }),
      },
    ],
  };
};
