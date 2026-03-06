import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { prism_init } from "./tools/init.js";
import { prism_status } from "./tools/status.js";
import { prism_refresh } from "./tools/refresh.js";
import { prism_viz_overview } from "./tools/viz-overview.js";
import { prism_viz_trace } from "./tools/viz-trace.js";
import { prism_viz_dependencies } from "./tools/viz-dependencies.js";
import { prism_viz_deadcode } from "./tools/viz-deadcode.js";
import { prism_build_analyze } from "./tools/build-analyze.js";
import { prism_build_plan } from "./tools/build-plan.js";
import { prism_build_apply } from "./tools/build-apply.js";
import { prism_build_verify } from "./tools/build-verify.js";

const root = process.env.PRISM_ROOT || process.cwd();
const ctx = { root };

export function createServer(): McpServer {
  const server = new McpServer(
    { name: "prism", version: "0.1.0" },
    { capabilities: { tools: { listChanged: true } } }
  );

  server.registerTool(
    "prism_init",
    {
      description: "Index the current repo and build the Ground Truth Registry (GTR).",
      inputSchema: z.object({ root: z.string().optional().describe("Repository root path") }),
    },
    (args) => prism_init(args as Record<string, unknown>, ctx)
  );

  server.registerTool(
    "prism_status",
    {
      description: "Report GTR freshness, coverage, and last-indexed timestamp.",
      inputSchema: z.object({ root: z.string().optional().describe("Repository root path") }),
    },
    (args) => prism_status(args as Record<string, unknown>, ctx)
  );

  server.registerTool(
    "prism_refresh",
    {
      description: "Incrementally update GTR for changed files only.",
      inputSchema: z.object({ root: z.string().optional().describe("Repository root path") }),
    },
    (args) => prism_refresh(args as Record<string, unknown>, ctx)
  );

  server.registerTool(
    "prism_viz_overview",
    {
      description: "Returns high-level architecture as Mermaid + JSON graph.",
      inputSchema: z.object({ root: z.string().optional() }),
    },
    (args) => prism_viz_overview(args as Record<string, unknown>, ctx)
  );

  server.registerTool(
    "prism_viz_trace",
    {
      description: "Traces a symbol or path end-to-end through the codebase.",
      inputSchema: z.object({
        root: z.string().optional().describe("Repository root path"),
        fileOrSymbol: z.string().optional().describe("File path or symbol to trace"),
        depth: z.number().optional().describe("Max depth"),
      }),
    },
    (args) => prism_viz_trace(args as Record<string, unknown>, ctx)
  );

  server.registerTool(
    "prism_viz_dependencies",
    {
      description: "Shows import/export graph for a given file or module.",
      inputSchema: z.object({
        root: z.string().optional().describe("Repository root path"),
        file: z.string().optional().describe("File path"),
      }),
    },
    (args) => prism_viz_dependencies(args as Record<string, unknown>, ctx)
  );

  server.registerTool(
    "prism_viz_deadcode",
    {
      description: "Finds unreachable/unused exports with proof citations.",
      inputSchema: z.object({}),
    },
    (args) => prism_viz_deadcode(args as Record<string, unknown>, ctx)
  );

  server.registerTool(
    "prism_build_analyze",
    {
      description: "Scores codebase health, returns structured BUILD BRIEF.",
      inputSchema: z.object({}),
    },
    (args) => prism_build_analyze(args as Record<string, unknown>, ctx)
  );

  server.registerTool(
    "prism_build_plan",
    {
      description: "Given a task description, produces bounded context slice.",
      inputSchema: z.object({
        root: z.string().optional().describe("Repository root path"),
        task: z.string().describe("Task description"),
        agentName: z.string().optional(),
        maxFiles: z.number().optional(),
        directRefs: z.array(z.string()).optional(),
      }),
    },
    (args) => prism_build_plan(args as Record<string, unknown>, ctx)
  );

  server.registerTool(
    "prism_build_apply",
    {
      description: "Applies a validated patch to the filesystem (with preview).",
      inputSchema: z.object({
        patch: z.string().optional(),
        preview: z.boolean().optional(),
      }),
    },
    (args) => prism_build_apply(args as Record<string, unknown>, ctx)
  );

  server.registerTool(
    "prism_build_verify",
    {
      description: "Runs symbol validation on any proposed code block.",
      inputSchema: z.object({ code: z.string().describe("Code block to verify") }),
    },
    (args) => prism_build_verify(args as Record<string, unknown>, ctx)
  );

  return server;
}

export async function runStdio(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
