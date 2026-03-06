import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export interface SessionManifest {
  task_id: string;
  task_description: string;
  timestamp: string;
  agent: string;
  scope: string[];
  files: string[];
}

export async function createSessionDir(root: string): Promise<string> {
  const sessionsDir = join(root, ".prism", "sessions");
  await mkdir(sessionsDir, { recursive: true });
  const taskId = randomUUID();
  const dir = join(sessionsDir, taskId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function writeManifest(
  sessionDir: string,
  manifest: SessionManifest
): Promise<void> {
  const path = join(sessionDir, "manifest.json");
  await writeFile(path, JSON.stringify(manifest, null, 2), "utf-8");
}

export async function writeContext(sessionDir: string, context: string): Promise<void> {
  const path = join(sessionDir, "context.md");
  await writeFile(path, context, "utf-8");
}

export async function writeOutput(sessionDir: string, output: string): Promise<void> {
  const path = join(sessionDir, "output.md");
  await writeFile(path, output, "utf-8");
}

export async function readContext(sessionDir: string): Promise<string> {
  const path = join(sessionDir, "context.md");
  return readFile(path, "utf-8");
}

export async function readOutput(sessionDir: string): Promise<string> {
  const path = join(sessionDir, "output.md");
  return readFile(path, "utf-8");
}
