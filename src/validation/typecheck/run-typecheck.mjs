import { EXIT_CODES } from '../../exit-codes/codes.mjs';
import { formatFailure } from '../../diagnostics/format-failure.mjs';
import { normalizeValidationResult } from '../common/validation-result.mjs';

/** Execute the optional consumer typecheck script as a validation stage. */
export async function runTypecheck(context, typecheckScript) {
  if (!context || typeof context !== 'object') throw new TypeError('runTypecheck requires a context');
  if (!typecheckScript || typeof context.runTypecheck !== 'function') return 0;
  let result;
  try {
    result = (await context.runTypecheck(['run', 'typecheck'], { cwd: context.cwd, inheritEnv: !context.sanitizeEnv })) ?? {};
  } catch (error) {
    context.write(`Typecheck failed to start: ${error.message}\n`);
    return EXIT_CODES.TYPECHECK_FAILURE;
  }
  const normalized = normalizeValidationResult(result);
  if (normalized.code !== 0) context.write(formatFailure('Typecheck', normalized));
  return normalized.code === 0 ? 0 : EXIT_CODES.TYPECHECK_FAILURE;
}
