import { EXIT_CODES } from '../../exit-codes.mjs';
import { formatFailure } from '../diagnostics.mjs';
export async function runBuildStage(context, buildScript) {
  if (!buildScript || !context.runBuild) return 0;
  let result;
  try { result = (await context.runBuild(['run', 'build'], { cwd: context.cwd, inheritEnv: !context.sanitizeEnv })) ?? {}; } catch (error) { context.write(`Build failed to start: ${error.message}\n`); return EXIT_CODES.BUILD_FAILURE; }
  const normalized = normalizeResult(result);
  if (normalized.code !== 0) context.write(formatFailure('Build', normalized));
  return normalized.code === 0 ? 0 : EXIT_CODES.BUILD_FAILURE;
}
const normalizeResult = (result) => ({ ...result, output: typeof result.output === 'string' ? result.output : '', code: Number.isInteger(result.code) ? result.code : 1 });
