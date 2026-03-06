import * as vscode from "vscode";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { GtrSchema, buildGraphFromGtr, toJson, getImports, getExports } from "@prism-ai/core";
import { PrismVizPanel } from "./panels/PrismVizPanel.js";

function workspaceRoot(): string | null {
  const folder = vscode.workspace.workspaceFolders?.[0];
  return folder?.uri.fsPath ?? null;
}

async function loadGtrFromWorkspace(): Promise<ReturnType<typeof GtrSchema.parse>> {
  const root = workspaceRoot();
  if (!root) throw new Error("No workspace folder open.");
  const gtrPath = join(root, ".prism", "gtr.json");
  const raw = await readFile(gtrPath, "utf-8");
  return GtrSchema.parse(JSON.parse(raw));
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("prism.vizOverview", async () => {
      try {
        const gtr = await loadGtrFromWorkspace();
        const graph = buildGraphFromGtr(gtr);
        const json = toJson(graph);
        PrismVizPanel.show(context, "PRISM: VIZ Overview", json);
      } catch (err) {
        void vscode.window.showErrorMessage(
          `PRISM VIZ failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("prism.vizDependencies", async () => {
      try {
        const root = workspaceRoot();
        if (!root) throw new Error("No workspace folder open.");
        const editor = vscode.window.activeTextEditor;
        if (!editor) throw new Error("No active editor.");

        const gtr = await loadGtrFromWorkspace();
        const rel = vscode.workspace.asRelativePath(editor.document.uri.fsPath, false);

        const imports = getImports(gtr, rel);
        const exports = getExports(gtr, rel);

        // Minimal focused graph: node + imported specifiers as nodes (unresolved labels).
        const nodes = new Set([rel, ...imports.map((i) => i.from)]);
        const edges: [string, string][] = imports.map((i) => [rel, i.from]);

        PrismVizPanel.show(
          context,
          `PRISM: VIZ Dependencies — ${rel}`,
          { nodes: [...nodes], edges },
          { focusNodeId: rel }
        );

        void vscode.window.showInformationMessage(
          `PRISM: ${imports.length} imports · ${exports.length} exports`
        );
      } catch (err) {
        void vscode.window.showErrorMessage(
          `PRISM VIZ dependencies failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    })
  );
}

export function deactivate(): void {}
