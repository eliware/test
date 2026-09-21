import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { createJestProcessOptions } from "./create-jest-process-options.mjs";
import { buildJestArguments } from "./build-jest-arguments.mjs";
import { resolveFocusedCoverage } from "./resolve-focused-coverage.mjs";
import { validateFocusedTestPath } from "./validate-focused-test-path.mjs";
import { cleanupCoverage } from "./cleanup-coverage.mjs";
import { runChild } from "./run-child.mjs";

const TIMING_REPORTER = fileURLToPath(new URL("./jest-timing-reporter.mjs", import.meta.url));
const PROGRESS_REPORTER = fileURLToPath(new URL("./jest-progress-reporter.mjs", import.meta.url));
function resolveConsumerJestCli(root) {
  const packageEntry = createRequire(join(root, "package.json")).resolve("jest-cli");
  return join(dirname(packageEntry), "../bin/jest.js");
}

export async function runJest(root, args, execute, options) {
  args ??= [];
  const focusedPath = await validateFocusedTestPath(root, args);
  const focusedCoverage = await resolveFocusedCoverage(root, focusedPath);
  await cleanupCoverage(root);
  const jestArguments = buildJestArguments(args);
  const jestCli =
    options?.jestCli ?? (execute === runChild ? resolveConsumerJestCli(root) : "jest-cli");
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
      "--reporters",
      PROGRESS_REPORTER,
      ...(args.includes("--debug-timing") ? ["--reporters", TIMING_REPORTER] : []),
      ...focusedCoverage,
      ...jestArguments.slice(1),
    ],
    createJestProcessOptions(root, args, options),
  );
}
