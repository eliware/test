import { EXIT_CODES } from '../../exit-codes/codes.mjs';
import { formatFailure } from '../../diagnostics/format-failure.mjs';

/** Convert a Jest stage result into the toolkit's public failure outcome. */
export function handleTestResult(result, write, cwd) {
  if (result.code === EXIT_CODES.TEST_START || result.code === EXIT_CODES.COVERAGE_CLEANUP) return result.code;
  if (result.code !== 0) {
    write(formatFailure('Tests', result, cwd));
    return EXIT_CODES.TEST_FAILURE;
  }
  return null;
}
