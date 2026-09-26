import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createJestProcessOptions } from "./create-jest-process-options.mjs";
import { buildJestArguments } from "./build-jest-arguments.mjs";
import { resolveFocusedCoverage } from "./resolve-focused-coverage.mjs";
import { validateFocusedTestPath } from "./validate-focused-test-path.mjs";

const TIMING_REPORTER = fileURLToPath(new URL("./jest-timing-reporter.mjs", import.meta.url));
const PROGRESS_REPORTER = fileURLToPath(new URL("./jest-progress-reporter.mjs", import.meta.url));

export async function prepareJestRun(root, args = [], resolveCli, options) {
  const focusedPath = await validateFocusedTestPath(root, args);
  const focusedCoverage = await resolveFocusedCoverage(root, focusedPath);
  const jestArguments = buildJestArguments(args);
  const jestCli = resolveCli(root, options);
  const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const configuredReporters = packageJson.jest?.reporters ?? [];
  if (!Array.isArray(configuredReporters) || configuredReporters.some((reporter) => typeof reporter !== "string")) {
    throw new Error("Jest reporters with per-reporter options are not supported by eliware-test.");
  }
  const reporters = [...new Set([...configuredReporters, "default", PROGRESS_REPORTER])];
  if (args.includes("--debug-timing")) reporters.push(TIMING_REPORTER);
  const coverageDirectory = join(tmpdir(), "eliware-test", `coverage-${randomUUID()}`);
  return {
    coverageDirectory,
    command: process.execPath,
    args: [
      jestCli,
      jestArguments[0],
      "--coverageReporters=json",
      "--coverageReporters=json-summary",
      "--coverageReporters=text",
      "--coverageDirectory",
      coverageDirectory,
      ...reporters.flatMap((reporter) => ["--reporters", reporter]),
      ...focusedCoverage,
      ...jestArguments.slice(1),
    ],
    options: createJestProcessOptions(root, args, options),
  };
}
