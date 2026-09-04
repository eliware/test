import { extractFocusedPaths } from '../../arguments/focused-paths.mjs';
import { validateFocusedPaths } from '../../testing/validate-focused-paths.mjs';
import { selectTestCoverage } from '../../testing/focused-coverage/select-test-selection.mjs';

export async function prepareTestSelection(cwd, args, accessPath) {
  const missing = await validateFocusedPaths(cwd, args, accessPath);
  if (missing) return { missing };
  const focusedPathMode = extractFocusedPaths(args).length > 0;
  const focusedCoverage = await selectTestCoverage(cwd, args, accessPath, focusedPathMode);
  return { focusedPathMode, focusedCoverage };
}
