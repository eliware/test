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
  const processOptions = createJestProcessOptions(root, args, options);
  const coverageDirectory =
    (await options?.createCoverageDirectory?.()) ?? (await createJestCoverageDirectory());
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
    options: processOptions,
  };
}
