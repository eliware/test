import { fileURLToPath } from "node:url";
import { createJestProcessOptions } from "./create-jest-process-options.mjs";
import { buildJestArguments } from "./build-jest-arguments.mjs";
import { resolveFocusedCoverage } from "./resolve-focused-coverage.mjs";
import { validateFocusedTestPath } from "./validate-focused-test-path.mjs";
import { cleanupCoverage } from "./cleanup-coverage.mjs";

const TIMING_REPORTER = fileURLToPath(new URL("./jest-timing-reporter.mjs", import.meta.url));
const PROGRESS_REPORTER = fileURLToPath(new URL("./jest-progress-reporter.mjs", import.meta.url));

export async function prepareJestRun(root, args = [], resolveCli, options) {
  const focusedPath = await validateFocusedTestPath(root, args);
  const focusedCoverage = await resolveFocusedCoverage(root, focusedPath);
  await cleanupCoverage(root);
  const jestArguments = buildJestArguments(args);
  const jestCli = resolveCli(root, options);
  return {
    command: process.execPath,
    args: [
      jestCli,
      jestArguments[0],
      "--coverageReporters=json",
      "--coverageReporters=json-summary",
      "--coverageReporters=text",
      "--reporters",
      "default",
      "--reporters",
      PROGRESS_REPORTER,
      ...(args.includes("--debug-timing") ? ["--reporters", TIMING_REPORTER] : []),
      ...focusedCoverage,
      ...jestArguments.slice(1),
    ],
    options: createJestProcessOptions(root, args, options),
  };
}
