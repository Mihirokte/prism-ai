import { Parser as TSParser, Language } from "web-tree-sitter";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

let parserInitDone = false;
const languages = new Map<string, Language>();

export type ParserInitOptions = {
  /** Optional path to tree-sitter.wasm (for Parser.init locateFile) */
  locateFile?: (path: string) => string;
};

/**
 * Initialize the tree-sitter WASM runtime. Must be called before using the parser.
 */
export async function initParser(options?: ParserInitOptions): Promise<void> {
  if (parserInitDone) return;
  await TSParser.init(options);
  parserInitDone = true;
}

/**
 * Load a language from a .wasm file path or from a Uint8Array buffer.
 */
export async function loadLanguage(
  langId: string,
  input: string | Uint8Array
): Promise<Language> {
  const lang = await Language.load(input);
  languages.set(langId, lang);
  return lang;
}

/**
 * Load language WASM from the given file system path.
 */
export async function loadLanguageFromPath(
  langId: string,
  wasmPath: string
): Promise<Language> {
  const path = wasmPath.startsWith("file:") ? fileURLToPath(wasmPath) : wasmPath;
  const buf = await readFile(path);
  return loadLanguage(langId, new Uint8Array(buf));
}

/**
 * Get a previously loaded language by id.
 */
export function getLanguage(langId: string): Language | undefined {
  return languages.get(langId);
}

/**
 * Create a new Parser instance with the given language set.
 */
export function createParser(lang?: Language | null): TSParser {
  const p = new TSParser();
  if (lang) p.setLanguage(lang);
  return p;
}

export type { Language };
