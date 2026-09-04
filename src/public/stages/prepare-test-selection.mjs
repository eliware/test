import { validateFocusedPaths } from '../../testing/validate-focused-paths.mjs';
import { selectTestCoverage } from '../../testing/focused-coverage/select-test-selection.mjs';

export async function prepareTestSelection(cwd, args, accessPath) {
  const missing = await validateFocusedPaths(cwd, args, accessPath);
  if (missing) return { missing };
  const focusedPathMode = args.some((arg) => /(?:^|[\\/])tests?[\\/].+\.(?:mjs|js|cjs|jsx|ts|tsx)$/.test(arg));
  const focusedCoverage = await selectTestCoverage(cwd, args, accessPath, focusedPathMode);
  return { focusedPathMode, focusedCoverage };
}
