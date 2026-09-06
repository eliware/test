import { validateCoverage } from '../../public/stages/coverage.mjs';
import { EXIT_CODES } from '../../exit-codes/codes.mjs';

/** Run and normalize the post-test coverage stage. */
export async function runCoverageStage({ cwd, testResult, write, readFilePath, statPath, startedAt, ignoreCoverage, coverageValidator = validateCoverage }) {
  if (ignoreCoverage) return 0;
  try {
    const result = await coverageValidator(cwd, testResult.output, write, readFilePath, statPath, startedAt);
    return Number.isInteger(result) ? result : EXIT_CODES.COVERAGE_FAILURE;
  } catch (error) {
    write(`Coverage validation failed: ${error?.message ?? String(error)}\n`);
    return EXIT_CODES.COVERAGE_FAILURE;
  }
}
