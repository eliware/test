import { validateLintOptions } from '../public/validate-lint-options.mjs';
import { EXIT_CODES } from '../exit-codes/codes.mjs';
import { runOxlint } from '../validation/lint/run-oxlint.mjs';
import { inspectWorkspace } from '../workspace/inspect-workspace.mjs';
import { createTiming } from '../diagnostics/timing.mjs';
import { runChildProcess } from '../processes/run-child-process.mjs';
import { inspectLintWorkspace } from './lint-workspace.mjs';
import { reportLintResult } from './report-lint-result.mjs';

/** Run the standalone lint command and return the package exit code. */
export async function runLintCommand(options) {
  validateLintOptions(options);
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

  const lintCode = reportLintResult(result, write);
  if (lintCode !== 0) return lintCode;
  timing.step('Lint', 'complete');
  return lintCode;
}
