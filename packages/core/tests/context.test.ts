import { describe, it, expect } from "vitest";
import { estimateTokens, getBudget, CONTEXT_BUDGET } from "../src/index.js";

describe("Context Budgeter", () => {
  it("estimateTokens returns ~chars/4", () => {
    expect(estimateTokens("hello")).toBe(2);
    expect(estimateTokens("a".repeat(40))).toBe(10);
  });

  it("getBudget returns positive number for known agent", () => {
    const budget = getBudget("claude-code");
    expect(budget).toBeGreaterThan(0);
    expect(budget).toBe(180_000 - 20_000);
  });

  it("getBudget returns default for unknown agent", () => {
    const budget = getBudget("unknown-agent");
    expect(budget).toBe(100_000 - 20_000);
  });

  it("CONTEXT_BUDGET has expected keys", () => {
    expect(CONTEXT_BUDGET["claude-code"]).toBeDefined();
    expect(CONTEXT_BUDGET["gemini-cli"]).toBeDefined();
    expect(CONTEXT_BUDGET["default"]).toBeDefined();
  });
});
