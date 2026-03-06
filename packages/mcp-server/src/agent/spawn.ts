import { spawn } from "node:child_process";
import { createSessionDir, writeManifest, writeContext, writeOutput } from "./session.js";
import type { SessionManifest } from "./session.js";

export type SpawnOptions = {
  root: string;
  taskDescription: string;
  context: string;
  agentCommand: string;
  agentArgs: string[];
};

export async function spawnAgent(options: SpawnOptions): Promise<{
  sessionDir: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}> {
  const { root, taskDescription, context, agentCommand, agentArgs } = options;
  const sessionDir = await createSessionDir(root);
  const manifest: SessionManifest = {
    task_id: sessionDir.split(/[/\\]/).pop() ?? "unknown",
    task_description: taskDescription,
    timestamp: new Date().toISOString(),
    agent: agentCommand,
    scope: [],
    files: [],
  };
  await writeManifest(sessionDir, manifest);
  await writeContext(sessionDir, context);

  const args = [...agentArgs, context];
  const proc = spawn(agentCommand, args, {
    cwd: root,
    stdio: ["pipe", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  proc.stdout?.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  proc.stderr?.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const exitCode = await new Promise<number | null>((resolve) => {
    proc.on("close", resolve);
  });

  await writeOutput(sessionDir, stdout);

  return { sessionDir, exitCode, stdout, stderr };
}
