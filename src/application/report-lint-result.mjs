import { assertExitCode } from '../public/exit-contract.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';
import { formatFailure } from '../diagnostics/format-failure.mjs';
import { lintFailed, normalizeLintResult } from '../validation/lint/result.mjs';

/** Report a normalized lint result and return the public exit code. */
export function reportLintResult(result, write) {
  const normalized = normalizeLintResult(result);
  if (lintFailed(normalized)) {
    write(formatFailure('Lint', normalized));
    return assertExitCode(EXIT_CODES.LINT_FAILURE, 'runLintCommand');
  }
  write('Lint passed: 0 warnings\n');
  return assertExitCode(0, 'runLintCommand');
}
