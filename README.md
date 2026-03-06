# PRISM — Project Repository Intelligence, Synthesis & Mapping

PRISM is a **zero-hallucination** repository intelligence layer that wraps CLI-based AI coding tools (Claude Code, Gemini CLI, Codex CLI, Cursor, Aider, VS Code extensions) behind a deterministic foundation:

- **VIZ**: deterministic, AST-driven repository visualization (no LLM inference for structure)
- **BUILD**: bounded-context agent orchestration with post-generation verification against ground truth

PRISM **never calls LLM APIs directly**. Any “intelligence” comes from your host tool; PRISM provides **context slicing, validation, and reproducible outputs**.

## Status (this repo)

This monorepo implements **Phase 1 (core foundation)** and **Phase 2 (MCP server via stdio)** per the spec. CLI + VS Code extension are scaffolded stubs.

## Requirements

- Node.js **>= 22**
- pnpm

## Quick start (development)

```bash
pnpm install
pnpm run build
pnpm run test
```

## Packages

| Package | NPM name | Purpose |
|--------:|----------|---------|
| `packages/core` | `@prism-ai/core` | GTR, AST parser (tree-sitter via WASM), dependency graph, validator, context budgeter |
| `packages/mcp-server` | `@prism-ai/mcp` | MCP server exposing PRISM tools over stdio |
| `packages/cli` | `@prism-ai/cli` | Standalone CLI (stub; Phase 3) |
| `packages/vscode` | `@prism-ai/vscode` | VS Code extension (stub; Phase 5) |

## Architecture overview

At runtime, PRISM revolves around the **Ground Truth Registry (GTR)** stored at `.prism/gtr.json`.

- **GTR**: file hashes + imports/exports + symbol index + dependency manifest
- **VIZ**: derives graphs and traces strictly from GTR (deterministic)
- **BUILD**: creates bounded context slices from GTR and verifies agent output against GTR

## Ground Truth Registry (GTR)

PRISM writes `.prism/gtr.json` (gitignored by default). It contains:

- `files[path]`: `{ hash, mtime, language, ... }`
- `symbols`: extracted symbol entries (when tree-sitter grammars are provided)
- `imports` / `exports`: per-file edges and exported names
- `deps`: manifest dependencies (from `package.json` for Node projects)

### Tree-sitter grammars (WASM)

PRISM’s parser uses `web-tree-sitter` (WASM). For **full symbol extraction**, supply `wasmPaths` when building the GTR:

```ts
import { buildGtr } from "@prism-ai/core";

await buildGtr({
  root: process.cwd(),
  wasmPaths: {
    javascript: "path/to/tree-sitter-javascript.wasm",
    typescript: "path/to/tree-sitter-typescript.wasm",
    python: "path/to/tree-sitter-python.wasm",
  },
});
```

Without WASM grammars, PRISM still builds GTR **file hashes and import/export data**, but `symbols` will be empty.

## MCP server

The MCP server is implemented in `packages/mcp-server` and runs over **stdio**.

### Run locally

```bash
node packages/mcp-server/dist/cli.js
```

### MCP tools exposed

**System**
- `prism_init`: index repo, build GTR
- `prism_status`: report GTR stats and freshness
- `prism_refresh`: incremental reindex

**VIZ**
- `prism_viz_overview`: Mermaid + JSON dependency graph (+ cycle info)
- `prism_viz_trace`: trace a file through the dependency graph
- `prism_viz_dependencies`: show imports/exports for a file
- `prism_viz_deadcode`: list unused exports (based on imports/exports in GTR)

**BUILD**
- `prism_build_analyze`: light health signals (cycles, coupling, dead code)
- `prism_build_plan`: create bounded context slice (max files, token budgeting)
- `prism_build_verify`: validate a code block’s referenced symbols/packages against GTR
- `prism_build_apply`: patch preview (apply step is intentionally conservative in this repo)

## “Zero hallucination” guardrails

PRISM enforces a verification pipeline:

- **Context bounding**: bounded context slice (default max 15 files)
- **Symbol & package validation**: reject outputs referencing unknown symbols/packages
- **Fuzzy correction suggestions**: offer closest real symbols from GTR for retries

## Development conventions

- TypeScript strict mode; ESM-only packages (`\"type\": \"module\"`)
- Atomic writes for `.prism/*` state (write `.tmp`, then rename)
- No LLM SDK dependencies (no `anthropic`, `openai`, `@google/generative-ai`, etc.)

## Cursor agent rules

Repo guidance is in `.cursor/rules/`:

- `prism-monorepo.mdc` — always applied (structure + constraints)
- `prism-core.mdc` — `packages/core/**/*.ts`
- `prism-mcp.mdc` — `packages/mcp-server/**/*.ts`
- `prism-cli.mdc` — `packages/cli/**/*.ts`
- `prism-vscode.mdc` — `packages/vscode/**/*.ts`

## Roadmap

- Phase 3: VIZ TUI + Mermaid/HTML exporters
- Phase 4: BUILD orchestration (sub-agent spawning + patch apply workflow)
- Phase 5: VS Code extension (Activity Bar views + localhost MCP host)
