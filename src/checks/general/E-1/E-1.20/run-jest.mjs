import { fileURLToPath } from "node:url";
import { runChild } from "./run-child.mjs";
import { createJestProcessOptions } from "./create-jest-process-options.mjs";
import { buildJestArguments } from "./build-jest-arguments.mjs";
import { resolveFocusedCoverage } from "./resolve-focused-coverage.mjs";
import { validateFocusedTestPath } from "./validate-focused-test-path.mjs";

const TIMING_REPORTER = fileURLToPath(new URL("./jest-timing-reporter.mjs", import.meta.url));
const PROGRESS_REPORTER = fileURLToPath(new URL("./jest-progress-reporter.mjs", import.meta.url));

export async function runJest(root, args = [], execute = runChild, options = {}) {
  const focusedPath = await validateFocusedTestPath(root, args);
  const focusedCoverage = await resolveFocusedCoverage(root, focusedPath);
  const jestArguments = buildJestArguments(args);
  return execute(
    process.execPath,
    [
      "node_modules/jest/bin/jest.js",
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
    createJestProcessOptions(root, args, options),
  );
}
