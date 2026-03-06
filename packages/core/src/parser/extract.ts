import type { Language, Node } from "web-tree-sitter";
import type { SymbolKind } from "../schemas/symbols.js";
import type { SymbolEntry, ExportedSymbol, ResolvedImport } from "../schemas/symbols.js";
import { createParser } from "./init.js";

const JS_TS_DECLARATION_TYPES = new Set([
  "function_declaration",
  "generator_function_declaration",
  "class_declaration",
  "method_definition",
  "lexical_declaration",
  "variable_declaration",
  "type_alias_declaration",
  "interface_declaration",
  "enum_declaration",
  "export_statement",
]);

const PY_DECLARATION_TYPES = new Set([
  "function_definition",
  "class_definition",
]);

function kindFromNodeType(type: string, lang: string): SymbolKind {
  if (type.includes("function") || type === "method_definition") return "function";
  if (type.includes("class")) return "class";
  if (type === "interface_declaration") return "interface";
  if (type === "type_alias_declaration") return "type";
  if (type === "enum_declaration") return "enum";
  if (type === "method_definition") return "method";
  return "variable";
}

function getNameFromNode(node: Node, source: string): string | null {
  const nameNode =
    node.childForFieldName("name") ??
    node.childForFieldName("declarator")?.firstNamedChild ??
    node.namedChild(0);
  if (!nameNode) return null;
  return source.slice(nameNode.startIndex, nameNode.endIndex) || null;
}

function walkDeclarations(
  node: Node,
  source: string,
  lang: string,
  declTypes: Set<string>,
  file: string,
  out: { symbols: Map<string, SymbolEntry>; exports: ExportedSymbol[] }
): void {
  if (declTypes.has(node.type)) {
    const name = getNameFromNode(node, source);
    const kind = kindFromNodeType(node.type, lang);
    const line = node.startPosition.row + 1;
    const isExport =
      node.type === "export_statement" ||
      (node.parent?.type === "export_statement");
    if (name && node.type !== "export_statement") {
      const key = `${file}:${name}`;
      const symKind: SymbolKind =
        node.type === "method_definition" ? "method" : kind;
      out.symbols.set(key, {
        kind: symKind,
        file,
        line,
        exported: isExport,
        signature: undefined,
      });
      if (isExport) {
        out.exports.push({ name, kind: symKind, line });
      }
    }
    if (node.type === "export_statement") {
      const spec = node.childForFieldName("declaration") ?? node.namedChild(0);
      if (spec) {
        const exportName = getNameFromNode(spec, source);
        if (exportName) {
          const subKind = kindFromNodeType(spec.type, lang);
          out.exports.push({
            name: exportName,
            kind: subKind === "variable" ? "constant" : subKind,
            line: spec.startPosition.row + 1,
          });
        }
      }
    }
  }
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.isNamed) {
      walkDeclarations(child, source, lang, declTypes, file, out);
    }
  }
}

function collectImports(node: Node, source: string, file: string): ResolvedImport[] {
  const imports: ResolvedImport[] = [];
  if (node.type === "import_statement" || node.type === "import_declaration") {
    const fromNode = node.childForFieldName("source") ?? node.childForFieldName("module_specifier");
    const from = fromNode
      ? source.slice(fromNode.startIndex, fromNode.endIndex).replace(/['"]/g, "")
      : "";
    const specifiers: { local: string; imported?: string }[] = [];
    const clause = node.childForFieldName("named_imports") ?? node.childForFieldName("specifiers");
    if (clause) {
      for (let i = 0; i < clause.childCount; i++) {
        const s = clause.child(i);
        if (s?.isNamed) {
          const local = s.childForFieldName("name") ?? s.childForFieldName("local") ?? s.namedChild(0);
          const imported = s.childForFieldName("exported") ?? s.childForFieldName("imported");
          if (local) {
            specifiers.push({
              local: source.slice(local.startIndex, local.endIndex),
              imported: imported ? source.slice(imported.startIndex, imported.endIndex) : undefined,
            });
          }
        }
      }
    }
    const def = node.childForFieldName("default_import") ?? node.childForFieldName("name");
    if (def && specifiers.length === 0) {
      specifiers.push({ local: source.slice(def.startIndex, def.endIndex) });
    }
    if (from || specifiers.length > 0) {
      imports.push({ from, specifiers });
    }
  }
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child?.isNamed) {
      imports.push(...collectImports(child, source, file));
    }
  }
  return imports;
}

export interface ExtractResult {
  symbols: Map<string, SymbolEntry>;
  exports: ExportedSymbol[];
  imports: ResolvedImport[];
}

/**
 * Extract symbols, exports, and imports from source code using tree-sitter.
 * Requires a Language to be loaded for the given langId (javascript, typescript, python).
 */
export function extractSymbols(
  source: string,
  langId: string,
  filePath: string,
  language?: Language | null
): ExtractResult {
  const symbols = new Map<string, SymbolEntry>();
  const exports: ExportedSymbol[] = [];
  const imports: ResolvedImport[] = [];

  if (!language) {
    return { symbols, exports, imports };
  }

  const parser = createParser(language);
  const tree = parser.parse(source);
  parser.delete();
  if (!tree) return { symbols, exports, imports };

  const root = tree.rootNode;
  const declTypes =
    langId === "python" ? PY_DECLARATION_TYPES : JS_TS_DECLARATION_TYPES;

  walkDeclarations(root, source, langId, declTypes, filePath, { symbols, exports });
  imports.push(...collectImports(root, source, filePath));

  tree.delete();
  return { symbols, exports, imports };
}

/**
 * Infer language id from file path.
 */
export function langFromPath(filePath: string): "javascript" | "typescript" | "python" | "unknown" {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".py")) return "python";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "typescript";
  if (lower.endsWith(".js") || lower.endsWith(".mjs") || lower.endsWith(".cjs") || lower.endsWith(".jsx")) return "javascript";
  return "unknown";
}
