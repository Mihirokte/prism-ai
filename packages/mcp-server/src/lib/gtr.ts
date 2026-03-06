import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { GtrSchema, type Gtr } from "@prism-ai/core";

const PRISM_VERSION = "0.1.0";

export function getGtrPath(root: string): string {
  return join(root, ".prism", "gtr.json");
}

export async function loadGtr(root: string): Promise<Gtr | null> {
  try {
    const path = getGtrPath(root);
    const raw = await readFile(path, "utf-8");
    const data = JSON.parse(raw);
    return GtrSchema.parse(data);
  } catch {
    return null;
  }
}

export function gtrHash(gtr: Gtr): string {
  return `${Object.keys(gtr.files).length}-${gtr.builtAt ?? ""}`;
}

export { PRISM_VERSION };
