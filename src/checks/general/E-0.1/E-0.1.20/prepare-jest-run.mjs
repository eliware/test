import { join } from "node:path";
import { createJestCoverageDirectory } from "./create-jest-coverage-directory.mjs";
import { createJestProcessOptions } from "./create-jest-process-options.mjs";
import { buildJestArguments } from "./build-jest-arguments.mjs";
import { resolveFocusedCoverage } from "./resolve-focused-coverage.mjs";
import { validateFocusedTestPath } from "./validate-focused-test-path.mjs";
import { resolveJestReporters } from "./resolve-jest-reporters.mjs";

export async function prepareJestRun(root, args = [], resolveCli, options) {
  const focusedPath = await validateFocusedTestPath(root, args);
  const focusedCoverage = await resolveFocusedCoverage(root, focusedPath);
  const jestArguments = buildJestArguments(args);
  const jestCli = resolveCli(root, options);
  const reporters = await resolveJestReporters(root, args);
  const coverageDirectory =
    (await options?.createCoverageDirectory?.()) ?? (await createJestCoverageDirectory());
  const reportFile = join(coverageDirectory, "jest-results.json");
  const consoleReportFile = join(coverageDirectory, "jest-console-output.json");
  const processOptions = createJestProcessOptions(root, args, {
    ...options,
    consoleReportFile,
  });
  return {
    coverageDirectory,
    reportFile,
    consoleReportFile,
    command: process.execPath,
    args: [
      jestCli,
      jestArguments[0],
      "--no-color",
      "--coverageReporters=json",
      "--coverageReporters=json-summary",
      "--coverageReporters=text",
      "--coverageDirectory",
      coverageDirectory,
      "--outputFile",
      reportFile,
      ...reporters.flatMap((reporter) => ["--reporters", reporter]),
      ...focusedCoverage,
      ...jestArguments.slice(1),
    ],
    options: processOptions,
  };
}
