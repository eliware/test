import { access } from 'node:fs/promises';
import { findIstanbulIgnoreViolations } from './policy/istanbul-ignore-policy.mjs';
import { checkGitignorePolicy } from './policy/gitignore-policy.mjs';

/** Run the workspace policies that must hold before child tools start. */
export async function checkWorkspacePolicies(cwd, write, accessPath, findIstanbulIgnores) {
  const findIgnores = findIstanbulIgnores ?? findIstanbulIgnoreViolations;
  const violations = await findIgnores(cwd);
  if (violations.length > 0) {
    write(`Istanbul ignore directives are not permitted here: ${violations.map((entry) => `${entry.file}:${entry.line}`).join(', ')}\n`);
    return false;
  }
  await checkGitignorePolicy(cwd, write, accessPath ?? access);
  return true;
}
