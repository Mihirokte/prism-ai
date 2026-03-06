export const CONTEXT_BUDGET: Record<string, number> = {
  "claude-code": 180_000,
  "gemini-cli": 900_000,
  "codex-cli": 180_000,
  cursor: 120_000,
  aider: 100_000,
  default: 100_000,
};

const RESERVE_RESPONSE = 20_000;

/**
 * Get token budget for an agent (total context minus reserve for response).
 */
const DEFAULT_BUDGET = 100_000;

export function getBudget(agentName: string): number {
  const total = CONTEXT_BUDGET[agentName] ?? DEFAULT_BUDGET;
  return Math.max(0, total - RESERVE_RESPONSE);
}
