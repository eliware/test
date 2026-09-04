import { resolveFocusedCoverage } from './resolve-selection.mjs';

export async function selectTestCoverage(cwd, args, accessPath, focusedPathMode) {
  return focusedPathMode ? resolveFocusedCoverage(cwd, args, accessPath) : [];
}
