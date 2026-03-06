import { z } from "zod";
import {
  SymbolEntrySchema,
  ResolvedImportSchema,
  ExportedSymbolSchema,
} from "./symbols.js";

/** Per-file metadata in GTR */
export const FileEntrySchema = z.object({
  hash: z.string(),
  mtime: z.number().nonnegative(),
  language: z.enum(["javascript", "typescript", "python", "go", "rust", "unknown"]),
  ast_summary: z.string().optional(),
});
export type FileEntry = z.infer<typeof FileEntrySchema>;

/** Resolved manifest (package.json / requirements.txt / go.mod) */
export const ResolvedManifestSchema = z.object({
  dependencies: z.record(z.string()).default({}),
  devDependencies: z.record(z.string()).optional(),
  peerDependencies: z.record(z.string()).optional(),
});
export type ResolvedManifest = z.infer<typeof ResolvedManifestSchema>;

/** Ground Truth Registry — single source of truth for all agent context */
export const GtrSchema = z.object({
  version: z.number().int().positive().default(1),
  builtAt: z.string().optional(),
  root: z.string(),
  files: z.record(z.string(), FileEntrySchema),
  symbols: z.record(z.string(), SymbolEntrySchema),
  imports: z.record(z.string(), z.array(ResolvedImportSchema)),
  exports: z.record(z.string(), z.array(ExportedSymbolSchema)),
  deps: ResolvedManifestSchema,
});
export type Gtr = z.infer<typeof GtrSchema>;
