/**
 * Simple token estimation: ~4 chars per token (typical for English/code).
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
