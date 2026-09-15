import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { createJestProcessOptions } from "./create-jest-process-options.mjs";
import { buildJestArguments } from "./build-jest-arguments.mjs";
import { resolveFocusedCoverage } from "./resolve-focused-coverage.mjs";
import { validateFocusedTestPath } from "./validate-focused-test-path.mjs";

const TIMING_REPORTER = fileURLToPath(new URL("./jest-timing-reporter.mjs", import.meta.url));
const PROGRESS_REPORTER = fileURLToPath(new URL("./jest-progress-reporter.mjs", import.meta.url));
const require = createRequire(import.meta.url);
const jestCli = join(dirname(require.resolve("jest-cli")), "../bin/jest.js");

export async function runJest(root, args, execute, options) {
  args ??= [];
  const focusedPath = await validateFocusedTestPath(root, args);
  const focusedCoverage = await resolveFocusedCoverage(root, focusedPath);
  const jestArguments = buildJestArguments(args);
  return execute(
    process.execPath,
    [
      jestCli,
      jestArguments[0],
      "--coverageReporters=json",
      "--coverageReporters=json-summary",
      "--coverageReporters=text",
      "--reporters",
      "default",
      "--reporters", PROGRESS_REPORTER,
      ...(args.includes("--debug-timing") ? ["--reporters", TIMING_REPORTER] : []),
      ...focusedCoverage,
      ...jestArguments.slice(1),
    ],
    createJestProcessOptions(root, args, options),
  );
}
