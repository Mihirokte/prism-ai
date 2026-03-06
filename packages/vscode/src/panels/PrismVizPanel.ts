import * as vscode from "vscode";

export type PrismVizGraph = {
  nodes: string[];
  edges: [string, string][];
};

export class PrismVizPanel {
  private static current: PrismVizPanel | undefined;

  static show(
    context: vscode.ExtensionContext,
    title: string,
    graph: PrismVizGraph,
    options?: { focusNodeId?: string }
  ): void {
    const column = vscode.window.activeTextEditor?.viewColumn ?? vscode.ViewColumn.One;

    const panel =
      PrismVizPanel.current?.panel ??
      vscode.window.createWebviewPanel("prismViz", title, column, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "media"),
          vscode.Uri.joinPath(context.extensionUri, "node_modules"),
        ],
      });

    PrismVizPanel.current = new PrismVizPanel(panel, context);
    PrismVizPanel.current.setHtml();
    PrismVizPanel.current.postGraph(graph, options);
    panel.reveal(column);
  }

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext
  ) {
    this.panel.onDidDispose(() => {
      if (PrismVizPanel.current?.panel === this.panel) {
        PrismVizPanel.current = undefined;
      }
    });
  }

  private setHtml(): void {
    const webview = this.panel.webview;

    const loaderUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "vis-network.min.js")
    );

    const visEsmUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        "node_modules",
        "vis-network",
        "standalone",
        "esm",
        "vis-network.esm.min.js"
      )
    );

    const nonce = String(Date.now());

    this.panel.webview.html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src ${webview.cspSource} 'unsafe-inline'; script-src ${webview.cspSource} 'nonce-${nonce}';">
    <title>PRISM VIZ</title>
    <style>
      :root {
        --bg: #0b0d12;
        --panel: #0f1320;
        --text: #e5e7eb;
        --muted: #94a3b8;
        --border: rgba(148,163,184,0.18);
        --accent: #60a5fa;
        --danger: #fb7185;
      }
      html, body { height: 100%; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
        overflow: hidden;
      }
      .wrap {
        display: grid;
        grid-template-rows: auto 1fr;
        height: 100%;
      }
      header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-bottom: 1px solid var(--border);
        background: linear-gradient(180deg, rgba(255,255,255,0.02), transparent);
      }
      .badge {
        font-weight: 700;
        letter-spacing: 0.12em;
        font-size: 11px;
        color: var(--accent);
      }
      input {
        flex: 1;
        background: var(--panel);
        border: 1px solid var(--border);
        color: var(--text);
        padding: 8px 10px;
        border-radius: 8px;
        outline: none;
      }
      .hint {
        font-size: 11px;
        color: var(--muted);
        white-space: nowrap;
      }
      #graph {
        height: 100%;
        width: 100%;
      }
      .footer {
        position: absolute;
        left: 12px;
        bottom: 10px;
        font-size: 11px;
        color: var(--muted);
        background: rgba(0,0,0,0.25);
        border: 1px solid var(--border);
        padding: 6px 8px;
        border-radius: 8px;
        backdrop-filter: blur(6px);
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <header>
        <div class="badge">PRISM_VIZ</div>
        <input id="search" placeholder="Search nodes… (type to focus)" />
        <div class="hint">Click node to highlight neighbors</div>
      </header>
      <div id="graph"></div>
    </div>
    <div class="footer" id="status">Waiting for graph…</div>

    <script nonce="${nonce}">
      // Provided by the extension
      window.__VIS_ESM_URI__ = ${JSON.stringify(String(visEsmUri))};
    </script>
    <script nonce="${nonce}" src="${loaderUri}"></script>
  </body>
</html>`;
  }

  private postGraph(graph: PrismVizGraph, options?: { focusNodeId?: string }): void {
    this.panel.webview.postMessage({ type: "graph", graph, options: options ?? {} });
  }
}

