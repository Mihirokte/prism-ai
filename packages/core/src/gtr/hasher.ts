import { readFile } from "node:fs/promises";
import { join } from "node:path";
import xxhash from "xxhash-wasm";

type XXHash = Awaited<ReturnType<typeof xxhash>>;
let hasherReady: XXHash | null = null;

async function getHasher(): Promise<XXHash> {
  if (!hasherReady) {
    hasherReady = await xxhash();
  }
  return hasherReady;
}

/**
 * Compute xxhash64 of file content as hex string.
 */
export async function hashFile(root: string, relativePath: string): Promise<string> {
  const full = join(root, relativePath);
  const content = await readFile(full, "utf-8");
  const h = await getHasher();
  return h.h64ToString(content);
}

/**
 * Compute xxhash64 of a string (e.g. file content already in memory).
 */
export async function hashContent(content: string): Promise<string> {
  const h = await getHasher();
  return h.h64ToString(content);
}
