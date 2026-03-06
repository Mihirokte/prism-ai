import { z } from "zod";

/** Symbol kind for GTR entries */
export const SymbolKindSchema = z.enum([
  "function",
  "class",
  "interface",
  "type",
  "constant",
  "variable",
  "method",
  "enum",
  "module",
]);
export type SymbolKind = z.infer<typeof SymbolKindSchema>;

/** Single symbol entry in the GTR */
export const SymbolEntrySchema = z.object({
  kind: SymbolKindSchema,
  file: z.string(),
  line: z.number().int().nonnegative(),
  exported: z.boolean(),
  signature: z.string().optional(),
});
export type SymbolEntry = z.infer<typeof SymbolEntrySchema>;

/** Resolved import: from file -> list of resolved (path, specifiers) */
export const ResolvedImportSchema = z.object({
  from: z.string(), // resolved path (file or package)
  specifiers: z.array(
    z.object({
      local: z.string(),
      imported: z.string().optional(), // if re-exported or aliased
    })
  ),
});
export type ResolvedImport = z.infer<typeof ResolvedImportSchema>;

/** Exported symbol from a file */
export const ExportedSymbolSchema = z.object({
  name: z.string(),
  kind: SymbolKindSchema,
  line: z.number().int().nonnegative(),
});
export type ExportedSymbol = z.infer<typeof ExportedSymbolSchema>;
