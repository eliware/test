import { assertLintOptions, assertExitCode } from '../public/contracts.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';
import { formatFailure } from '../diagnostics/format-failure.mjs';
import { runOxlint } from '../validation/lint/run-oxlint.mjs';
import { lintFailed, normalizeLintResult } from '../validation/lint/result.mjs';
import { inspectWorkspace } from '../workspace/inspect-workspace.mjs';
import { createTiming } from '../diagnostics/timing.mjs';
import { runChildProcess } from '../processes/run-child-process.mjs';
import { inspectLintWorkspace } from './lint-workspace.mjs';

/** Run the standalone lint command and return the package exit code. */
export async function runLintCommand(options) {
  assertLintOptions(options);
  const { cwd, write, inspect = inspectWorkspace, runLint = runOxlint } = options;
  const timing = createTiming(options.debugTiming, write);
  const workspaceResult = await inspectLintWorkspace({ cwd, write, inspect, accessPath: options.accessPath, findIstanbulIgnores: options.findIstanbulIgnores });
  if (workspaceResult) return workspaceResult;
  timing.step('Workspace inspection', 'lint');

  let result;
  try {
    result = (await runLint({ cwd, write, runChildProcess })) ?? {};
  } catch (error) {
    write(`Lint failed to start: ${error.message}\n`);
    return EXIT_CODES.LINT_START;
  }

  const normalized = normalizeLintResult(result);
  if (lintFailed(normalized)) {
    write(formatFailure('Lint', normalized));
    return assertExitCode(EXIT_CODES.LINT_FAILURE, 'runLintCommand');
  }
  timing.step('Lint', 'complete');
  write('Lint passed: 0 warnings\n');
  return assertExitCode(0, 'runLintCommand');
}
