import { writeFile, rename, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

/**
 * Write content to file atomically: write to .tmp then rename.
 * Never leaves partial writes on disk.
 */
export async function writeAtomic(filePath: string, content: string): Promise<void> {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
  const tmpPath = `${filePath}.tmp`;
  await writeFile(tmpPath, content, "utf-8");
  await rename(tmpPath, filePath);
}

/**
 * Write JSON to file atomically.
 */
export async function writeJsonAtomic(filePath: string, data: unknown): Promise<void> {
  const content = JSON.stringify(data, null, 2);
  await writeAtomic(filePath, content);
}
