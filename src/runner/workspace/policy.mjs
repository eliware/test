import { findIstanbulIgnoreViolations } from '../../istanbul.mjs';
import { formatIstanbulIgnoreFailure } from '../diagnostics.mjs';
export async function checkWorkspacePolicy(cwd, write, findIstanbulIgnores = findIstanbulIgnoreViolations) {
  const violations = await findIstanbulIgnores(cwd);
  if (violations.length > 0) { write(formatIstanbulIgnoreFailure(violations)); return false; }
  return true;
}
