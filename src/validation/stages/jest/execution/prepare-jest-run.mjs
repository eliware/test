import { join } from "node:path";
import { createJestCoverageDirectory } from "../configuration/create-jest-coverage-directory.mjs";
import { createJestProcessOptions } from "../../../shared/process/create-jest-process-options.mjs";
import { buildJestArguments } from "../configuration/build-jest-arguments.mjs";
import { resolveFocusedCoverage } from "../configuration/resolve-focused-coverage.mjs";
import { validateFocusedTestPath } from "../configuration/validate-focused-test-path.mjs";
import { resolveJestReporters } from "../configuration/resolve-jest-reporters.mjs";

export async function prepareJestRun(root, args = [], resolveCli, options) {
  const focusedPath = await validateFocusedTestPath(root, args);
  const focusedCoverage = await resolveFocusedCoverage(root, focusedPath);
  const jestArguments = buildJestArguments(args);
  const jestCli = resolveCli(root, options);
  const reporters = await resolveJestReporters(root);
  const coverageDirectory =
    (await options?.createCoverageDirectory?.()) ?? (await createJestCoverageDirectory());
  const consoleReportFile = join(coverageDirectory, "jest-console-output.json");
  const processOptions = createJestProcessOptions(root, args, {
    ...options,
    consoleReportFile,
  });
  return {
    coverageDirectory,
    consoleReportFile,
    command: process.execPath,
    args: [
      jestCli,
      jestArguments[0],
      "--no-color",
      // codescope ignore: request the text reporter so successful aggregate runs include the coverage summary
      "--coverageReporters=json",
      "--coverageReporters=json-summary",
      "--coverageReporters=text",
      "--coverageDirectory",
      coverageDirectory,
      ...reporters.flatMap((reporter) => ["--reporters", reporter]),
      ...focusedCoverage,
      ...jestArguments.slice(1),
    ],
    options: processOptions,
  };
}
