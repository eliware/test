import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const TIMING_REPORTER = fileURLToPath(new URL("./jest-timing-reporter.mjs", import.meta.url));
const PROGRESS_REPORTER = fileURLToPath(new URL("./jest-progress-reporter.mjs", import.meta.url));

export async function resolveJestReporters(root, args = [], read = readFile) {
  const packageJson = JSON.parse(await read(join(root, "package.json"), "utf8"));
  const configured = packageJson.jest?.reporters ?? [];
  if (!Array.isArray(configured) || configured.some((reporter) => typeof reporter !== "string")) {
    throw new Error("Jest reporters with per-reporter options are not supported by eliware-test.");
  }
  const reporters = [...new Set([...configured, "default", PROGRESS_REPORTER])];
  if (args.includes("--debug-timing")) reporters.push(TIMING_REPORTER);
  return [...new Set(reporters)];
}
