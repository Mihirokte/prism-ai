import { describe, it, expect } from "vitest";
import {
  buildGraphFromGtr,
  findCircularDependencies,
  couplingScore,
  findDeadCode,
  toMermaid,
  toJson,
  traceFrom,
} from "../src/index.js";
import type { Gtr } from "../src/schemas/gtr.js";

const mockGtr: Gtr = {
  version: 1,
  root: "/repo",
  files: {
    "a.ts": { hash: "1", mtime: 0, language: "typescript" },
    "b.ts": { hash: "2", mtime: 0, language: "typescript" },
  },
  symbols: {},
  imports: {
    "a.ts": [{ from: "./b", specifiers: [{ local: "x" }] }],
    "b.ts": [{ from: "./a", specifiers: [{ local: "y" }] }],
  },
  exports: {
    "a.ts": [{ name: "foo", kind: "function", line: 1 }],
    "b.ts": [{ name: "bar", kind: "function", line: 1 }],
  },
  deps: { dependencies: {} },
};

describe("Graph", () => {
  it("buildGraphFromGtr creates directed graph", () => {
    const graph = buildGraphFromGtr(mockGtr);
    expect(graph.nodes().length).toBeGreaterThanOrEqual(1);
  });

  it("findCircularDependencies returns shape", () => {
    const graph = buildGraphFromGtr(mockGtr);
    const result = findCircularDependencies(graph);
    expect(result).toHaveProperty("hasCycle");
    expect(result).toHaveProperty("cycles");
    expect(Array.isArray(result.cycles)).toBe(true);
  });

  it("couplingScore returns number", () => {
    const graph = buildGraphFromGtr(mockGtr);
    for (const node of graph.nodes()) {
      expect(couplingScore(graph, node)).toBeGreaterThanOrEqual(0);
    }
  });

  it("findDeadCode returns array", () => {
    const dead = findDeadCode(mockGtr);
    expect(Array.isArray(dead)).toBe(true);
  });

  it("toMermaid returns string", () => {
    const graph = buildGraphFromGtr(mockGtr);
    const mermaid = toMermaid(graph);
    expect(mermaid).toContain("flowchart");
  });

  it("toJson returns nodes and edges", () => {
    const graph = buildGraphFromGtr(mockGtr);
    const json = toJson(graph);
    expect(json).toHaveProperty("nodes");
    expect(json).toHaveProperty("edges");
  });

  it("traceFrom returns steps", () => {
    const graph = buildGraphFromGtr(mockGtr);
    const steps = traceFrom(graph, "a.ts", { depth: 5 });
    expect(Array.isArray(steps)).toBe(true);
  });
});
