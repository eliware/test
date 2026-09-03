import { EXIT_CODES } from '../../exit-codes.mjs';
import { formatFailure, hasLintWarnings } from '../diagnostics.mjs';
import { oxlintExclusionArguments } from '../../workspace.mjs';
export async function runLintStage(context) {
  let result;
  try { result = (await context.runLintCommand(['oxlint', '--deny-warnings', '.', ...oxlintExclusionArguments()], { cwd: context.cwd, inheritEnv: !context.sanitizeEnv })) ?? {}; } catch (error) { context.write(`Lint failed to start: ${error.message}\n`); return EXIT_CODES.LINT_START; }
  const normalized = normalizeResult(result);
  if (normalized.code !== 0 || hasLintWarnings(normalized.output)) { context.write(formatFailure('Lint', normalized)); return EXIT_CODES.LINT_FAILURE; }
  return 0;
}
const normalizeResult = (result) => ({ ...result, output: typeof result.output === 'string' ? result.output : '', code: Number.isInteger(result.code) ? result.code : 1 });
