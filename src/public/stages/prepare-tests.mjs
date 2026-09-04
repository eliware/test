import { resolve } from 'node:path';
import { validateFocusedPaths } from '../../testing/validate-focused-paths.mjs';
import { resolveFocusedCoverage } from '../../testing/focused-coverage/resolve-selection.mjs';

export async function prepareTests({ cwd, args, accessPath, removePath, debugTiming }) {
  const missing = await validateFocusedPaths(cwd, args, accessPath);
  if (missing) return { missing };
  const focusedPathMode = args.some((arg) => /(?:^|[\\/])tests?[\\/].+\.(?:mjs|js|cjs|jsx|ts|tsx)$/.test(arg));
  const focusedCoverage = focusedPathMode ? await resolveFocusedCoverage(cwd, args, accessPath) : [];
  const timingOutput = debugTiming ? resolve(cwd, '.eliware-test-timings.json') : undefined;
  if (timingOutput) {
    try { await removePath(timingOutput, { force: true }); }
    catch (error) { return { cleanupError: error }; }
  }
  return { focusedPathMode, focusedCoverage, timingOutput };
}
