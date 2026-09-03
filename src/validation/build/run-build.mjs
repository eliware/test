import { EXIT_CODES } from '../../exit-codes/codes.mjs';
import { formatFailure } from '../../diagnostics/format-failure.mjs';
import { normalizeValidationResult } from '../common/validation-result.mjs';

/** Execute the optional consumer build script as a validation stage. */
export async function runBuild(context, buildScript) {
  if (!context || typeof context !== 'object') throw new TypeError('runBuild requires a context');
  if (!buildScript || typeof context.runBuild !== 'function') return 0;
  let result;
  try {
    result = (await context.runBuild(['run', 'build'], { cwd: context.cwd, inheritEnv: !context.sanitizeEnv })) ?? {};
  } catch (error) {
    context.write(`Build failed to start: ${error.message}\n`);
    return EXIT_CODES.BUILD_FAILURE;
  }
  const normalized = normalizeValidationResult(result);
  if (normalized.code !== 0) context.write(formatFailure('Build', normalized));
  return normalized.code === 0 ? 0 : EXIT_CODES.BUILD_FAILURE;
}
