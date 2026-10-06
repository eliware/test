import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const PROGRESS_REPORTER = fileURLToPath(new URL("./jest-progress-reporter.mjs", import.meta.url));

export async function resolveJestReporters(root, read = readFile) {
  const packageJson = JSON.parse(await read(join(root, "package.json"), "utf8"));
  const configured = packageJson.jest?.reporters ?? [];
  if (!Array.isArray(configured) || configured.some((reporter) => typeof reporter !== "string")) {
    throw new Error("Jest reporters with per-reporter options are not supported by eliware-test.");
  }
  const reporters = [...new Set([...configured, "default", PROGRESS_REPORTER])];
  return [...new Set(reporters)];
}
